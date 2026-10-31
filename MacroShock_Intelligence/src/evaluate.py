"""Evaluation of Model 1 on held-out (chronological test) observations.

`compute_eval` works only from the historical prediction rows (is_scenario == False)
plus the split boundaries, so `python -m src.evaluate` can independently recompute
every number in outputs/model1_eval.csv from outputs/model1_macro_predictions.csv.

Metrics (per target x horizon x model; indicators with different units are never
aggregated together):
  MAE, RMSE      on the central estimate (p50 for quantile models, point forecast otherwise)
  pinball_q10/50/90, coverage_10_90, avg_interval_width   quantile models only
Metrics that do not apply are left empty (NaN), never 0.
"""
from __future__ import annotations

import argparse

import numpy as np
import pandas as pd

from .utils import demo_banner, get_paths, read_json

EVAL_COLUMNS = [
    "target_name", "target_unit", "horizon_months", "model_name", "split", "n",
    "train_start", "train_end", "test_start", "test_end",
    "MAE", "RMSE", "pinball_q10", "pinball_q50", "pinball_q90",
    "coverage_10_90", "avg_interval_width", "MAE_ratio_vs_persistence", "data_mode",
]


def pinball(y: np.ndarray, pred: np.ndarray, q: float) -> float:
    d = y - pred
    return float(np.mean(np.maximum(q * d, (q - 1.0) * d)))


def compute_eval(pred: pd.DataFrame, split_info: dict, data_mode: str) -> pd.DataFrame:
    hist = pred[~pred["is_scenario"].astype(bool)].copy()
    rows = []
    for (tname, h), g_th in hist.groupby(["target_name", "horizon_months"]):
        si = split_info[f"{tname}|{int(h)}"]
        pers = g_th[g_th["model_name"] == "persistence"]
        pers_mae = float(np.mean(np.abs(pers["actual"] - pers["p50"]))) if len(pers) else np.nan
        for model, g in g_th.groupby("model_name"):
            g = g.dropna(subset=["actual", "p50"])
            if g.empty:
                continue
            y, p50 = g["actual"].to_numpy(float), g["p50"].to_numpy(float)
            mae = float(np.mean(np.abs(y - p50)))
            row = {
                "target_name": tname, "target_unit": g["target_unit"].iloc[0], "horizon_months": int(h),
                "model_name": model, "split": "test", "n": int(len(g)),
                "train_start": si["train_start"], "train_end": si["train_end"],
                "test_start": si["test_start"], "test_end": si["test_end"],
                "MAE": mae, "RMSE": float(np.sqrt(np.mean((y - p50) ** 2))),
                "pinball_q10": np.nan, "pinball_q50": np.nan, "pinball_q90": np.nan,
                "coverage_10_90": np.nan, "avg_interval_width": np.nan,
                "MAE_ratio_vs_persistence": mae / pers_mae if pers_mae and pers_mae > 0 else np.nan,
                "data_mode": data_mode,
            }
            if g["p10"].notna().all() and g["p90"].notna().all():
                p10, p90 = g["p10"].to_numpy(float), g["p90"].to_numpy(float)
                row["pinball_q10"] = pinball(y, p10, 0.1)
                row["pinball_q50"] = pinball(y, p50, 0.5)
                row["pinball_q90"] = pinball(y, p90, 0.9)
                row["coverage_10_90"] = float(np.mean((y >= p10) & (y <= p90)))
                row["avg_interval_width"] = float(np.mean(p90 - p10))
            rows.append(row)
    return pd.DataFrame(rows, columns=EVAL_COLUMNS)


def main(demo: bool = False) -> pd.DataFrame:
    paths = get_paths(demo)
    demo_banner(demo)
    pred_path = paths["outputs"] / "model1_macro_predictions.csv"
    summ_path = paths["outputs"] / "model1_run_summary.json"
    if not pred_path.exists() or not summ_path.exists():
        raise SystemExit("Predictions/run summary not found. Run `python -m src.train_model1` first.")
    pred = pd.read_csv(pred_path)
    summ = read_json(summ_path)
    ev = compute_eval(pred, summ["split_info"], summ["data_mode"])
    ev.to_csv(paths["outputs"] / "model1_eval.csv", index=False)
    with pd.option_context("display.width", 200, "display.max_columns", 30, "display.float_format", "{:.4f}".format):
        print(ev[["target_name", "horizon_months", "model_name", "n", "MAE", "RMSE",
                  "coverage_10_90", "avg_interval_width", "MAE_ratio_vs_persistence"]].to_string(index=False))
    return ev


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--demo", action="store_true")
    main(demo=ap.parse_args().demo)
