"""Supervised-table construction for Model 1 (one table per target x horizon).

Timing contract (origin month t, horizon h, target availability lag L):

    shock               = shock in month t                      (known at end of t)
    shock_lag_k         = shock in month t-k
    target_lag_1        = target value of month t-L            (latest value KNOWN at t)
    target_lag_k        = target value of month t-L-(k-1)
    y                   = target value of month t+h             (what we predict)
    target_month        = t + h months (normalised month-end)

Nothing from after month t is ever used as an input. Missing values are never
filled; rows with any missing feature are dropped (kept only if y is the missing
piece, because those tail rows are the scenario origins).
"""
from __future__ import annotations

import pandas as pd

from .utils import month_end_range


def shock_feature_names(cfg: dict) -> list[str]:
    return ["shock"] + [f"shock_lag_{k}" for k in range(1, cfg["n_shock_lags"] + 1)]


def target_lag_names(cfg: dict) -> list[str]:
    return [f"target_lag_{k}" for k in range(1, cfg["n_target_lags"] + 1)]


def feature_names(cfg: dict, include_shock: bool = True) -> list[str]:
    return (shock_feature_names(cfg) if include_shock else []) + target_lag_names(cfg)


def build_supervised(panel: pd.DataFrame, target_cfg: dict, horizon: int, cfg: dict) -> pd.DataFrame:
    """Return rows with complete features. Column `y` is NaN for tail origins."""
    name = target_cfg["target_name"]
    if name not in panel.columns:
        raise KeyError(f"{name} not in panel")
    lag = int(target_cfg["availability_lag_months"])

    p = panel.copy()
    p["month_end"] = pd.to_datetime(p["month_end"]).dt.normalize()
    p = p.set_index("month_end").sort_index()
    expected = month_end_range(p.index.min(), p.index.max())
    if not p.index.equals(expected):
        raise ValueError("Panel month_end index must be a contiguous month-end calendar.")

    y_series = p[name]
    df = pd.DataFrame(index=p.index)
    df["shock"] = p["shock"]
    for k in range(1, cfg["n_shock_lags"] + 1):
        df[f"shock_lag_{k}"] = p["shock"].shift(k)
    for k in range(1, cfg["n_target_lags"] + 1):
        df[f"target_lag_{k}"] = y_series.shift(lag + k - 1)
    df["y"] = y_series.shift(-horizon)
    df["target_month"] = df.index + pd.offsets.MonthEnd(horizon)
    df["horizon_months"] = horizon
    df["target_name"] = name

    feats = feature_names(cfg, include_shock=True)
    df = df[df[feats].notna().all(axis=1)].copy()
    df.index.name = "month_end"
    return df.reset_index()
