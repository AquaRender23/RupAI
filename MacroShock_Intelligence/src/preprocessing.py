"""Build the monthly Model 1 panel from raw downloads.

Output: data/processed/model1_macro_panel.csv with columns
    month_end, usdinr_month_end, shock, <one column per collected macro target>

Rules enforced here (see handoff Part D5):
  * FX is cut at start_date BEFORE monthly aggregation / shock (as in Model 2).
  * Monthly aggregation = last observation of each calendar month.
  * No forward-fill, no back-fill, no interpolation, no zero-filling.
  * Year-over-year is computed only for index-type sources (documented per series).
"""
from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd

from .utils import (PROJECT_ROOT, compute_shock, demo_banner, get_paths, load_config,
                    month_end_range, to_monthly, write_json)


def read_raw(path: Path) -> pd.Series:
    df = pd.read_csv(path)
    s = pd.Series(pd.to_numeric(df["value"], errors="coerce").to_numpy(dtype=float),
                  index=pd.DatetimeIndex(pd.to_datetime(df["date"])))
    return s.dropna()


def apply_transform(monthly: pd.Series, transform: str) -> tuple[pd.Series, str]:
    """Returns (transformed monthly series, human-readable description)."""
    if transform == "level":
        return monthly, "level used as published"
    if transform == "yoy_pct_from_index":
        # reindex to a contiguous calendar so shift(12) means exactly 12 months
        full = monthly.reindex(month_end_range(monthly.index.min(), monthly.index.max()))
        yoy = (full / full.shift(12) - 1.0) * 100.0
        return yoy, "year-over-year % = (index_t / index_t-12 - 1) * 100 on a contiguous monthly calendar"
    raise ValueError(f"Unknown transform: {transform}")


def build_panel(raw_dir: Path, cfg: dict, allow_manual: bool = True) -> tuple[pd.DataFrame, dict]:
    log: dict = {"steps": [], "targets_included": [], "targets_skipped": {}}

    # ---- FX (shared definition) --------------------------------------------
    fx = read_raw(raw_dir / "USDINR_daily.csv")
    fx = fx[fx.index >= pd.Timestamp(cfg["start_date"])]
    if fx.empty:
        raise ValueError("No USD/INR observations on/after start_date.")
    log["steps"].append(f"USD/INR daily cut to >= {cfg['start_date']} before aggregation (matches Model 2)")
    usdinr_m = to_monthly(fx)
    log["steps"].append("USD/INR -> month-end = last available daily observation per calendar month")
    idx = month_end_range(usdinr_m.index.min(), usdinr_m.index.max())
    missing_months = idx.difference(usdinr_m.index)
    if len(missing_months):
        log["steps"].append(f"WARNING: {len(missing_months)} calendar months have no USD/INR data; left as NaN")
    usdinr_m = usdinr_m.reindex(idx)
    panel = pd.DataFrame(index=idx)
    panel["usdinr_month_end"] = usdinr_m
    panel["shock"] = compute_shock(usdinr_m)
    log["steps"].append("shock = (usdinr_month_end / previous_month_end - 1) * 100; first month = NaN")

    # ---- Macro targets -----------------------------------------------------
    for t in cfg["targets"]:
        if not t["enabled"]:
            continue
        name = t["target_name"]
        if t["source_type"] == "manual_csv":
            raw_path = PROJECT_ROOT / t["path"]
            if not allow_manual or not raw_path.exists():
                log["targets_skipped"][name] = "manual file not provided"
                continue
            df = pd.read_csv(raw_path)
            s = pd.Series(pd.to_numeric(df.iloc[:, 1], errors="raise").to_numpy(dtype=float),
                          index=pd.DatetimeIndex(pd.to_datetime(df.iloc[:, 0]))).dropna()
        else:
            p = raw_dir / f"{t['series_id']}.csv"
            if not p.exists():
                log["targets_skipped"][name] = "raw file missing (download failed or not run)"
                continue
            s = read_raw(p)
        monthly = to_monthly(s)  # one obs/month for monthly sources; 'last' rule documented
        transformed, desc = apply_transform(monthly, t["transform"])
        transformed = transformed.reindex(idx)  # only months inside the FX calendar; NaN elsewhere
        panel[name] = transformed
        n_obs = int(transformed.notna().sum())
        if n_obs == 0:
            panel = panel.drop(columns=[name])
            log["targets_skipped"][name] = "no observations inside the panel date range"
            continue
        log["targets_included"].append(name)
        log["steps"].append(f"{name}: monthly last-obs; {desc}; {n_obs} observations in panel; "
                            f"first={transformed.dropna().index.min().date()} last={transformed.dropna().index.max().date()}")

    if not log["targets_included"]:
        raise ValueError("No macro target ended up in the panel.")
    panel = panel.reset_index()
    panel["month_end"] = pd.to_datetime(panel["month_end"]).dt.normalize()
    return panel, log


def main(demo: bool = False, config_path: str | None = None) -> pd.DataFrame:
    cfg = load_config(config_path)
    paths = get_paths(demo)
    demo_banner(demo)
    panel, log = build_panel(paths["raw"], cfg, allow_manual=not demo)
    out = paths["processed"] / "model1_macro_panel.csv"
    to_save = panel.copy()
    to_save["month_end"] = to_save["month_end"].dt.strftime("%Y-%m-%d")
    to_save.to_csv(out, index=False)
    log["data_mode"] = "DEMO_SYNTHETIC" if demo else "real"
    log["panel_first_month_end"] = str(panel["month_end"].min().date())
    log["panel_last_month_end"] = str(panel["month_end"].max().date())
    write_json(log, paths["processed"] / "data_processing_log.json")
    print(f"Panel saved: {out}  ({len(panel)} months, {panel['month_end'].min().date()} -> {panel['month_end'].max().date()})")
    for name, why in log["targets_skipped"].items():
        print(f"  [omitted] {name}: {why}")
    return panel


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--demo", action="store_true")
    ap.add_argument("--config", default=None)
    a = ap.parse_args()
    main(demo=a.demo, config_path=a.config)
