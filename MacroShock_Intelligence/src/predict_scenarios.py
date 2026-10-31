"""Scenario predictions from saved Model 1 bundles.

Usage (after training):
    python -m src.predict_scenarios --shocks 5,8,10
    python -m src.predict_scenarios --shocks -3,0,5 --targets india_10y_gsec_yield_pct --horizon 1

How a scenario row is built
---------------------------
For each target/horizon we take the LATEST origin month with complete inputs.
In that row `shock` is replaced by the scenario value (shock_lag_k and the target
lags stay at their observed values). The model then predicts the target level at
origin + horizon months.

`baseline_prediction` is the same model with shock = 0. `estimated_change_pXX` is
(scenario pXX - baseline pXX) at the same quantile level. It is a model-based
difference between two predictions. It is NOT a causal effect.
"""
from __future__ import annotations

import argparse

import joblib
import numpy as np
import pandas as pd

from .utils import demo_banner, get_paths

PRED_COLUMNS = [
    "month_end", "target_month", "target_name", "target_unit", "horizon_months",
    "shock_pct", "p10", "p50", "p90", "actual", "model_name", "is_scenario",
    "data_cutoff", "model_train_end", "source_version", "data_mode",
    "outside_training_shock_range",
    "baseline_prediction", "scenario_prediction_p10", "scenario_prediction_p50",
    "scenario_prediction_p90", "estimated_change_p10", "estimated_change_p50",
    "estimated_change_p90",
]


def predict_quantiles(qmodels: dict, X: pd.DataFrame, quantiles: list[float]) -> np.ndarray:
    """Columns follow `quantiles` order, rows sorted so p10 <= p50 <= p90."""
    raw = np.column_stack([qmodels[q].predict(X) for q in quantiles])
    return np.sort(raw, axis=1)


def build_scenario_rows(bundle: dict, shocks: list[float], quantiles: list[float]) -> pd.DataFrame:
    feats = bundle["features"]
    base_row = dict(bundle["origin_features"])
    lo, hi = bundle["train_shock_min"], bundle["train_shock_max"]

    def frame(s: float) -> pd.DataFrame:
        r = dict(base_row)
        r["shock"] = float(s)
        return pd.DataFrame([r])[feats]

    base_q = predict_quantiles(bundle["qmodels"], frame(0.0), quantiles)[0]
    base_lr = float(bundle["lr"].predict(frame(0.0))[0])

    rows = []
    for s in shocks:
        common = {
            "month_end": bundle["origin_month"],
            "target_month": bundle["scenario_target_month"],
            "target_name": bundle["target_name"],
            "target_unit": bundle["target_unit"],
            "horizon_months": bundle["horizon"],
            "shock_pct": float(s),
            "actual": np.nan,
            "is_scenario": True,
            "data_cutoff": bundle["origin_month"],
            "model_train_end": bundle["model_train_end"],
            "source_version": bundle["source_version"],
            "data_mode": bundle["data_mode"],
            "outside_training_shock_range": bool(s < lo or s > hi),
        }
        q = predict_quantiles(bundle["qmodels"], frame(s), quantiles)[0]
        rows.append({**common, "model_name": "quantile_regression",
                     "p10": q[0], "p50": q[1], "p90": q[2],
                     "baseline_prediction": base_q[1],
                     "scenario_prediction_p10": q[0], "scenario_prediction_p50": q[1], "scenario_prediction_p90": q[2],
                     "estimated_change_p10": q[0] - base_q[0],
                     "estimated_change_p50": q[1] - base_q[1],
                     "estimated_change_p90": q[2] - base_q[2]})
        lr = float(bundle["lr"].predict(frame(s))[0])
        rows.append({**common, "model_name": "linear_regression",
                     "p10": np.nan, "p50": lr, "p90": np.nan,
                     "baseline_prediction": base_lr,
                     "scenario_prediction_p10": np.nan, "scenario_prediction_p50": lr,
                     "scenario_prediction_p90": np.nan,
                     "estimated_change_p10": np.nan, "estimated_change_p50": lr - base_lr,
                     "estimated_change_p90": np.nan})
    return pd.DataFrame(rows).reindex(columns=PRED_COLUMNS)


def main(demo: bool = False, shocks: list[float] | None = None,
         targets: list[str] | None = None, horizon: int | None = None) -> pd.DataFrame:
    from .utils import load_config
    cfg = load_config()
    paths = get_paths(demo)
    demo_banner(demo)
    shocks = shocks if shocks is not None else cfg["scenario_shocks_pct"]
    files = sorted(paths["models"].glob("*.joblib"))
    if not files:
        raise SystemExit(f"No saved models in {paths['models']}. Run `python -m src.train_model1` first.")
    frames = []
    for f in files:
        b = joblib.load(f)
        if targets and b["target_name"] not in targets:
            continue
        if horizon is not None and b["horizon"] != horizon:
            continue
        frames.append(build_scenario_rows(b, shocks, cfg["quantiles"]))
    if not frames:
        raise SystemExit("No saved model matched the requested --targets/--horizon.")
    out = pd.concat(frames, ignore_index=True)
    for c in ("month_end", "target_month", "data_cutoff", "model_train_end"):
        out[c] = pd.to_datetime(out[c]).dt.strftime("%Y-%m-%d")
    dest = paths["outputs"] / "model1_scenarios_custom.csv"
    out.to_csv(dest, index=False)
    print(f"Scenario predictions saved: {dest}  ({len(out)} rows)")
    if (out["outside_training_shock_range"]).any():
        print("NOTE: some shocks lie outside the historical training range -> extrapolation, unsupported.")
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--demo", action="store_true")
    ap.add_argument("--shocks", default=None, help="comma-separated shock %% values, e.g. 5,8,10")
    ap.add_argument("--targets", default=None, help="comma-separated target names")
    ap.add_argument("--horizon", type=int, default=None)
    a = ap.parse_args()
    main(demo=a.demo,
         shocks=[float(x) for x in a.shocks.split(",")] if a.shocks else None,
         targets=a.targets.split(",") if a.targets else None,
         horizon=a.horizon)
