
"""Train and evaluate RupAI Model 1 (Macroeconomic Response Model).

Usage:
    python -m src.train_model1
    python -m src.train_model1 --demo

Trains:
    - Linear Regression
    - Quantile Regression
    - Quantile Regression without FX shock
    - Persistence baseline

Evaluates on a chronological held-out test set.
"""

from __future__ import annotations

import argparse
import platform
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
import sklearn

from sklearn.linear_model import LinearRegression, QuantileRegressor
from sklearn.metrics import r2_score

from . import evaluate as ev
from .feature_engineering import (
    build_supervised,
    feature_names,
    target_lag_names,
)
from .predict_scenarios import (
    PRED_COLUMNS,
    build_scenario_rows,
    predict_quantiles,
)
from .utils import demo_banner, get_paths, load_config, write_json


STALE_MONTHS_WARNING = 3


def fit_quantile_models(
    X: pd.DataFrame,
    y: pd.Series,
    quantiles: list[float]
) -> dict:
    return {
        q: QuantileRegressor(
            quantile=q,
            alpha=0.0,
            solver="highs"
        ).fit(X, y)
        for q in quantiles
    }


def calculate_accuracy_report(pred: pd.DataFrame) -> list:
    """Calculate regression metrics from held-out test predictions.

    Accuracy percentage is calculated as 100 - MAPE.
    It is an error-derived score, not a universal regression accuracy.
    """

    historical = pred[
        (pred["is_scenario"] == False)
    ].copy()

    results = []

    for (target, model), group in historical.groupby(
        ["target_name", "model_name"]
    ):

        actual = pd.to_numeric(
            group["actual"], errors="coerce"
        )

        predicted = pd.to_numeric(
            group["p50"], errors="coerce"
        )

        valid = (
            actual.notna()
            & predicted.notna()
            & np.isfinite(actual)
            & np.isfinite(predicted)
        )

        actual = actual[valid].to_numpy()
        predicted = predicted[valid].to_numpy()

        if len(actual) == 0:
            continue

        mae = float(
            np.mean(np.abs(actual - predicted))
        )

        rmse = float(
            np.sqrt(np.mean((actual - predicted) ** 2))
        )

        # MAPE is undefined when actual values are zero.
        nonzero = np.abs(actual) > 1e-8

        if nonzero.any():

            mape = float(
                np.mean(
                    np.abs(
                        (actual[nonzero] - predicted[nonzero])
                        / actual[nonzero]
                    )
                ) * 100
            )

            accuracy = 100 - mape

        else:
            mape = np.nan
            accuracy = np.nan

        r2 = (
            float(r2_score(actual, predicted))
            if len(actual) >= 2
            else np.nan
        )

        results.append({
            "target_name": target,
            "model_name": model,
            "MAPE_accuracy_pct": accuracy,
            "MAPE_pct": mape,
            "MAE": mae,
            "RMSE": rmse,
            "R2": r2,
        })

    return results


def _hist_frame(
    test,
    p10,
    p50,
    p90,
    model_name,
    tcfg,
    train_end,
    source_version,
    data_mode
) -> pd.DataFrame:

    n = len(test)

    return pd.DataFrame({
        "month_end": test["month_end"].to_numpy(),
        "target_month": test["target_month"].to_numpy(),
        "target_name": tcfg["target_name"],
        "target_unit": tcfg["unit"],
        "horizon_months": test["horizon_months"].to_numpy(),
        "shock_pct": test["shock"].to_numpy(),
        "p10": p10,
        "p50": p50,
        "p90": p90,
        "actual": test["y"].to_numpy(),
        "model_name": model_name,
        "is_scenario": False,
        "data_cutoff": test["month_end"].to_numpy(),
        "model_train_end": train_end,
        "source_version": source_version,
        "data_mode": data_mode,
        "outside_training_shock_range": np.nan,
        "baseline_prediction": np.nan,
        "scenario_prediction_p10": np.nan,
        "scenario_prediction_p50": np.nan,
        "scenario_prediction_p90": np.nan,
        "estimated_change_p10": np.nan,
        "estimated_change_p50": np.nan,
        "estimated_change_p90": np.nan,
    }, index=range(n))


def run_pipeline(
    cfg: dict,
    panel: pd.DataFrame,
    paths: dict,
    demo: bool,
    save_models: bool = True
) -> dict:

    data_mode = "DEMO_SYNTHETIC" if demo else "real"

    quantiles = cfg["quantiles"]
    test_start = pd.Timestamp(cfg["test_start"])

    panel = panel.copy()
    panel["month_end"] = pd.to_datetime(
        panel["month_end"]
    ).dt.normalize()

    panel_last = panel["month_end"].max()

    source_version = (
        f"model1-v{cfg['version']}|{data_mode}"
        f"|panel_last={panel_last.date()}"
    )

    hist_frames = []
    scen_frames = []

    split_info = {}
    manifest = {}
    skipped = {}
    origins = {}
    warnings = []
    trained = []

    for tcfg in cfg["targets"]:

        name = tcfg["target_name"]

        if not tcfg["enabled"]:
            continue

        if name not in panel.columns:
            skipped[name] = (
                "not in panel (series not collected / manual file not provided)"
            )
            continue

        for h in cfg["horizons_months"]:

            key = f"{name}|{h}"

            sup = build_supervised(
                panel, tcfg, h, cfg
            )

            labelled = sup[sup["y"].notna()]

            train = labelled[
                labelled["target_month"] < test_start
            ]

            test = labelled[
                labelled["target_month"] >= test_start
            ]

            if len(train) < cfg["min_train_obs"]:
                skipped[key] = (
                    f"only {len(train)} training observations before "
                    f"{test_start.date()} "
                    f"(minimum {cfg['min_train_obs']}); split NOT moved"
                )
                continue

            if len(test) < cfg["min_test_obs"]:
                skipped[key] = (
                    f"only {len(test)} test observations from "
                    f"{test_start.date()} "
                    f"(minimum {cfg['min_test_obs']}); "
                    "target data may end too early"
                )
                continue

            feats = feature_names(cfg, True)
            feats_ns = target_lag_names(cfg)

            Xtr = train[feats]
            ytr = train["y"]
            Xte = test[feats]

            train_end = train["target_month"].max()

            # Train models using training data only.
            lr = LinearRegression().fit(Xtr, ytr)

            qm = fit_quantile_models(
                Xtr, ytr, quantiles
            )

            qm_ns = fit_quantile_models(
                train[feats_ns], ytr, quantiles
            )

            args = (
                tcfg,
                train_end,
                source_version,
                data_mode
            )

            nan = np.full(len(test), np.nan)

            # Persistence baseline.
            hist_frames.append(
                _hist_frame(
                    test,
                    nan,
                    Xte["target_lag_1"].to_numpy(),
                    nan,
                    "persistence",
                    *args
                )
            )

            # Linear regression.
            hist_frames.append(
                _hist_frame(
                    test,
                    nan,
                    lr.predict(Xte),
                    nan,
                    "linear_regression",
                    *args
                )
            )

            # Quantile regression.
            q = predict_quantiles(
                qm, Xte, quantiles
            )

            hist_frames.append(
                _hist_frame(
                    test,
                    q[:, 0],
                    q[:, 1],
                    q[:, 2],
                    "quantile_regression",
                    *args
                )
            )

            # Quantile regression without FX shock.
            qn = predict_quantiles(
                qm_ns,
                test[feats_ns],
                quantiles
            )

            hist_frames.append(
                _hist_frame(
                    test,
                    qn[:, 0],
                    qn[:, 1],
                    qn[:, 2],
                    "quantile_regression_no_shock",
                    *args
                )
            )

            split_info[key] = {
                "basis": "target_month",
                "train_start": str(
                    train["target_month"].min().date()
                ),
                "train_end": str(train_end.date()),
                "n_train": int(len(train)),
                "test_start": str(
                    test["target_month"].min().date()
                ),
                "test_end": str(
                    test["target_month"].max().date()
                ),
                "n_test": int(len(test)),
            }

            manifest[key] = {
                "target_name": name,
                "target_unit": tcfg["unit"],
                "horizon_months": h,
                "target_definition": (
                    f"level of '{name}' at month t+{h} "
                    "(same unit as source after documented transform)"
                ),
                "availability_lag_months": (
                    tcfg["availability_lag_months"]
                ),
                "features_linear_regression_and_quantile_regression": feats,
                "features_quantile_regression_no_shock": feats_ns,
                "feature_timing": (
                    "shock/shock_lag_k: USD/INR month-end % change "
                    "at month t / t-k. target_lag_1 = latest target "
                    "value known at month t (month t - availability_lag); "
                    "target_lag_k goes one month further back each."
                ),
                "is_proxy_target": tcfg["is_proxy"],
                "preprocessing": (
                    "none (no scaling needed: unregularised "
                    "linear / quantile regression)"
                ),
            }

            # Refit on all labelled data for scenario prediction.
            Xall = labelled[feats]
            yall = labelled["y"]

            lr_f = LinearRegression().fit(Xall, yall)

            qm_f = fit_quantile_models(
                Xall, yall, quantiles
            )

            origin = sup.iloc[-1]

            origin_month = pd.Timestamp(
                origin["month_end"]
            )

            age = (
                (panel_last.year - origin_month.year) * 12
                + panel_last.month - origin_month.month
            )

            if age > STALE_MONTHS_WARNING:
                warnings.append(
                    f"{key}: latest usable inputs are from "
                    f"{origin_month.date()}, {age} months before "
                    f"the last FX month ({panel_last.date()}). "
                    "Scenario rows describe that stale origin."
                )

            bundle = {
                "target_name": name,
                "target_unit": tcfg["unit"],
                "horizon": h,
                "features": feats,
                "lr": lr_f,
                "qmodels": qm_f,
                "origin_features": {
                    f: float(origin[f]) for f in feats
                },
                "origin_month": origin_month,
                "scenario_target_month": (
                    origin_month + pd.offsets.MonthEnd(h)
                ),
                "train_shock_min": float(
                    labelled["shock"].min()
                ),
                "train_shock_max": float(
                    labelled["shock"].max()
                ),
                "model_train_end": labelled["target_month"].max(),
                "source_version": source_version,
                "data_mode": data_mode,
            }

            origins[key] = str(origin_month.date())

            scen_frames.append(
                build_scenario_rows(
                    bundle,
                    cfg["scenario_shocks_pct"],
                    quantiles
                )
            )

            if save_models:
                joblib.dump(
                    bundle,
                    paths["models"] / f"model1_{name}_h{h}.joblib"
                )

            trained.append(key)

    if not trained:
        raise SystemExit(
            "No target could be trained. Reasons: "
            + "; ".join(
                f"{k}: {v}" for k, v in skipped.items()
            )
        )

    # Combine historical test predictions and scenario predictions.
    pred = pd.concat(
        hist_frames + scen_frames,
        ignore_index=True
    ).reindex(columns=PRED_COLUMNS)

    for c in (
        "month_end",
        "target_month",
        "data_cutoff",
        "model_train_end"
    ):
        pred[c] = pd.to_datetime(
            pred[c]
        ).dt.strftime("%Y-%m-%d")

    pred.to_csv(
        paths["outputs"] / "model1_macro_predictions.csv",
        index=False
    )

    # Existing evaluation.
    eval_df = ev.compute_eval(
        pred,
        split_info,
        data_mode
    )

    # New accuracy calculations.
    accuracy_report = calculate_accuracy_report(pred)

    accuracy_df = pd.DataFrame(
        accuracy_report
    )

    if not accuracy_df.empty:
        eval_df = eval_df.merge(
            accuracy_df,
            on=["target_name", "model_name"],
            how="left",
            suffixes=("", "_accuracy")
        )

    eval_df.to_csv(
        paths["outputs"] / "model1_eval.csv",
        index=False
    )

    # Model comparison statements.
    comparisons = []

    for (t, h), g in eval_df.groupby(
        ["target_name", "horizon_months"]
    ):

        m = g.set_index("model_name")["MAE"]

        if (
            "persistence" in m.index
            and "quantile_regression" in m.index
        ):

            better = (
                m["quantile_regression"] < m["persistence"]
            )

            comparisons.append(
                f"{t} h={h}: quantile_regression MAE "
                f"{m['quantile_regression']:.4f} "
                f"{'<' if better else '>='} persistence MAE "
                f"{m['persistence']:.4f} "
                f"({'beats' if better else 'does NOT beat'} persistence)"
            )

        if (
            "quantile_regression" in m.index
            and "quantile_regression_no_shock" in m.index
        ):

            better = (
                m["quantile_regression"]
                < m["quantile_regression_no_shock"]
            )

            comparisons.append(
                f"{t} h={h}: adding the FX shock features "
                f"{'lowered' if better else 'did NOT lower'} "
                f"test MAE "
                f"({m['quantile_regression']:.4f} vs "
                f"{m['quantile_regression_no_shock']:.4f} without shock)"
            )

    write_json(
        manifest,
        paths["outputs"] / "model1_feature_manifest.json"
    )

    summary = {
        "data_mode": data_mode,
        "generated_at_utc": datetime.now(
            timezone.utc
        ).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "config_version": cfg["version"],
        "source_version": source_version,
        "panel_first_month_end": str(
            panel["month_end"].min().date()
        ),
        "panel_last_month_end": str(
            panel_last.date()
        ),
        "test_start": cfg["test_start"],
        "horizons_months": cfg["horizons_months"],
        "targets_trained": trained,
        "targets_skipped": skipped,
        "excluded_targets_not_verified": cfg.get(
            "excluded_targets", []
        ),
        "split_info": split_info,
        "scenario_origin_month": origins,
        "warnings": warnings,
        "comparisons_on_test_set": comparisons,
        "accuracy_metrics": accuracy_report,
        "caveats": [
            "Observational predictive model; differences between "
            "scenario and baseline are NOT causal effects.",
            "Scenario shocks outside the historical training range "
            "are extrapolation (flagged in the output).",
            "MAPE-derived accuracy is not a universal regression "
            "accuracy measure and may be negative."
        ] + (
            [
                "DEMO MODE: all numbers come from synthetic data "
                "and say nothing about real performance."
            ]
            if demo else []
        ),
        "environment": {
            "python": platform.python_version(),
            "pandas": pd.__version__,
            "numpy": np.__version__,
            "scikit_learn": sklearn.__version__,
        },
    }

    write_json(
        summary,
        paths["outputs"] / "model1_run_summary.json"
    )

    return summary


def main(
    demo: bool = False,
    config_path: str | None = None
) -> None:

    cfg = load_config(config_path)

    paths = get_paths(demo)

    demo_banner(demo)

    panel_path = (
        paths["processed"] / "model1_macro_panel.csv"
    )

    if not panel_path.exists():
        raise SystemExit(
            f"{panel_path} not found. Run "
            f"`python -m src.data_collection"
            f"{' --demo' if demo else ''}` first."
        )

    panel = pd.read_csv(
        panel_path,
        parse_dates=["month_end"]
    )

    summary = run_pipeline(
        cfg,
        panel,
        paths,
        demo
    )

    print(f"\nData mode: {summary['data_mode']}")

    print(
        f"Panel: {summary['panel_first_month_end']} "
        f"-> {summary['panel_last_month_end']}"
    )

    print(
        f"Trained: {', '.join(summary['targets_trained'])}"
    )

    for k, v in summary["targets_skipped"].items():
        print(f"Skipped: {k} -> {v}")

    for w in summary["warnings"]:
        print(f"WARNING: {w}")

    print(
        "\nTest-set evaluation (held-out, chronological):"
    )

    ev.main(demo=demo)

    print("\nComparisons:")

    for c in summary["comparisons_on_test_set"]:
        print("  -", c)

    print(
        f"\nOutputs written to: {paths['outputs']}"
    )

    # Final accuracy report.
    print(
        "\n========== MODEL 1 ACCURACY REPORT =========="
    )

    for item in summary["accuracy_metrics"]:

        print(
            f"\nTarget: {item['target_name']}"
        )

        print(
            f"Model: {item['model_name']}"
        )

        accuracy = item["MAPE_accuracy_pct"]

        if np.isfinite(accuracy):
            print(
                f"MAPE-derived Accuracy: {accuracy:.2f}%"
            )
        else:
            print(
                "MAPE-derived Accuracy: Not available"
            )

        print(
            f"MAPE: {item['MAPE_pct']:.2f}%"
            if np.isfinite(item["MAPE_pct"])
            else "MAPE: Not available"
        )

        print(
            f"MAE:  {item['MAE']:.4f}"
        )

        print(
            f"RMSE: {item['RMSE']:.4f}"
        )

        print(
            f"R2:   {item['R2']:.4f}"
            if np.isfinite(item["R2"])
            else "R2: Not available"
        )

    print(
        "\n============================================="
    )


if __name__ == "__main__":

    ap = argparse.ArgumentParser()

    ap.add_argument(
        "--demo",
        action="store_true",
        help="use SYNTHETIC demo data (not real)"
    )

    ap.add_argument(
        "--config",
        default=None
    )

    a = ap.parse_args()

    main(
        demo=a.demo,
        config_path=a.config
    )
