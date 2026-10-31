"""Shared helpers for RupAI Model 1.

The functions `to_monthly` and `compute_shock` implement the SHARED FX
conventions described in the RupAI handoff (Model 2 compatibility reference):

* daily USD/INR -> last available observation in each calendar month
* index = normalised calendar month-end timestamp (named ``month_end``)
* shock = (USDINR_month_end / USDINR_previous_month_end - 1) * 100
* positive shock = USD/INR rose = rupee depreciated

Do NOT change these without changing Model 2 at the same time.
"""
from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG = PROJECT_ROOT / "config" / "config.json"


def load_config(path: str | Path | None = None) -> dict:
    path = Path(path) if path else DEFAULT_CONFIG
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def get_paths(demo: bool = False) -> dict[str, Path]:
    """Folder layout. Demo mode is fully separated from real-data paths."""
    if demo:
        paths = {
            "raw": PROJECT_ROOT / "data" / "demo" / "raw",
            "processed": PROJECT_ROOT / "data" / "demo" / "processed",
            "metadata": PROJECT_ROOT / "data" / "demo" / "source_metadata.csv",
            "models": PROJECT_ROOT / "models" / "demo",
            "outputs": PROJECT_ROOT / "outputs" / "demo",
        }
    else:
        paths = {
            "raw": PROJECT_ROOT / "data" / "raw",
            "processed": PROJECT_ROOT / "data" / "processed",
            "metadata": PROJECT_ROOT / "data" / "source_metadata.csv",
            "models": PROJECT_ROOT / "models",
            "outputs": PROJECT_ROOT / "outputs",
        }
    for key in ("raw", "processed", "models", "outputs"):
        paths[key].mkdir(parents=True, exist_ok=True)
    return paths


def demo_banner(demo: bool) -> None:
    if demo:
        print("=" * 78)
        print("DEMO MODE: SYNTHETIC DATA. NOT REAL. Results say nothing about real-world")
        print("performance and must never be reported as such.")
        print("=" * 78)


def to_monthly(series: pd.Series) -> pd.Series:
    """Daily (or any) series -> last available observation per calendar month.

    Index becomes the normalised calendar month-end date (midnight), named
    ``month_end``. Months with no observation are simply absent (never filled).
    """
    s = series.dropna().sort_index()
    idx = pd.DatetimeIndex(s.index)
    if idx.tz is not None:
        idx = idx.tz_localize(None)
    s = pd.Series(s.to_numpy(dtype=float), index=idx)
    monthly = s.groupby(s.index.to_period("M")).last()
    monthly.index = monthly.index.to_timestamp(how="end").normalize()
    monthly.index.name = "month_end"
    return monthly


def compute_shock(monthly_usdinr: pd.Series) -> pd.Series:
    """Monthly USD/INR % change x 100 (identical to Model 2's definition).

    The first month has no prior month and stays NaN.
    """
    s = monthly_usdinr.sort_index()
    shock = (s / s.shift(1) - 1.0) * 100.0
    shock.name = "shock"
    return shock


def month_end_range(first, last) -> pd.DatetimeIndex:
    """Contiguous normalised month-end index from first..last (inclusive)."""
    per = pd.period_range(pd.Timestamp(first), pd.Timestamp(last), freq="M")
    idx = per.to_timestamp(how="end").normalize()
    idx.name = "month_end"
    return idx


def read_json(path: str | Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def write_json(obj, path: str | Path) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, default=str)
