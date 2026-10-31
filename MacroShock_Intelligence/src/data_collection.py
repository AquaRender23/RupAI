"""Download raw data for Model 1 and write source metadata.

Usage (from the project root):
    python -m src.data_collection            # real data (needs internet)
    python -m src.data_collection --demo     # SYNTHETIC demo data, clearly labelled

Real mode:
  * USD/INR: FRED DEXINUS (preferred, same as Model 2); Yahoo Finance INR=X fallback.
  * Macro targets: series listed in config/config.json (FRED CSV endpoint, no API key),
    plus an optional manual RBI repo-rate CSV.
  * If FX cannot be downloaded from either source the run STOPS. It never silently
    switches to synthetic data.
  * A macro series that fails to download is recorded as failed and skipped.
"""
from __future__ import annotations

import argparse
import io
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd

from . import preprocessing
from .utils import PROJECT_ROOT, demo_banner, get_paths, load_config

FRED_CSV_URL = "https://fred.stlouisfed.org/graph/fredgraph.csv?id={sid}"
HEADERS = {"User-Agent": "Mozilla/5.0 (RupAI-Model1 research pipeline)"}

METADATA_COLUMNS = [
    "target_name", "source_name", "series_id", "source_url", "unit",
    "frequency_original", "frequency_model", "seasonal_adjustment",
    "observation_definition", "publication_lag_or_availability_rule",
    "first_observation", "last_observation", "retrieved_at", "notes",
    "is_proxy", "status",
]


# --------------------------------------------------------------------------- #
# Downloaders
# --------------------------------------------------------------------------- #
def fetch_fred_series(series_id: str, retries: int = 3, timeout: int = 60) -> pd.Series:
    """Download a FRED series via the public CSV endpoint. '.' = missing -> NaN."""
    import requests

    url = FRED_CSV_URL.format(sid=series_id)
    last_err: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            r = requests.get(url, headers=HEADERS, timeout=timeout)
            r.raise_for_status()
            df = pd.read_csv(io.StringIO(r.text))
            if df.shape[1] < 2:
                raise ValueError(f"Unexpected FRED response for {series_id}: columns={list(df.columns)}")
            dates = pd.to_datetime(df.iloc[:, 0], errors="raise")
            values = pd.to_numeric(df.iloc[:, 1], errors="coerce")
            s = pd.Series(values.to_numpy(dtype=float), index=pd.DatetimeIndex(dates), name=series_id)
            if s.dropna().empty:
                raise ValueError(f"FRED returned no usable observations for {series_id}")
            return s
        except Exception as e:  # noqa: BLE001 - we re-raise after retries
            last_err = e
            time.sleep(2 * attempt)
    raise RuntimeError(f"FRED download failed for {series_id}: {last_err}")


def fetch_yahoo_usdinr(ticker: str, start: str) -> pd.Series:
    """Yahoo Finance fallback (auto_adjust=True, as in Model 2)."""
    import yfinance as yf

    df = yf.download(ticker, start=start, auto_adjust=True, progress=False)
    if df is None or df.empty:
        raise RuntimeError(f"Yahoo returned no data for {ticker}")
    close = df["Close"]
    if isinstance(close, pd.DataFrame):  # newer yfinance returns MultiIndex columns
        close = close.iloc[:, 0]
    close = close.dropna()
    idx = pd.DatetimeIndex(close.index)
    if idx.tz is not None:
        idx = idx.tz_localize(None)
    return pd.Series(close.to_numpy(dtype=float), index=idx, name=ticker)


def download_fx(cfg: dict) -> tuple[pd.Series, str]:
    """Returns (daily USD/INR series, source label). Stops with a clear error if both fail."""
    fx = cfg["fx"]
    errors = []
    try:
        s = fetch_fred_series(fx["fred_series_id"])
        return s, f"FRED {fx['fred_series_id']}"
    except Exception as e:  # noqa: BLE001
        errors.append(f"FRED {fx['fred_series_id']}: {e}")
        print(f"[warn] {errors[-1]}\n[warn] Falling back to Yahoo Finance {fx['yahoo_ticker']} ...")
    try:
        s = fetch_yahoo_usdinr(fx["yahoo_ticker"], cfg["start_date"])
        return s, f"Yahoo Finance {fx['yahoo_ticker']} (fallback)"
    except Exception as e:  # noqa: BLE001
        errors.append(f"Yahoo {fx['yahoo_ticker']}: {e}")
    sys.exit(
        "\nCould not download USD/INR from either source:\n  - " + "\n  - ".join(errors) +
        "\n\nCheck your internet connection / firewall and retry. The pipeline will NOT "
        "substitute synthetic data automatically. (To test the code only, use --demo.)"
    )


def read_manual_csv(path: Path) -> pd.Series:
    """Manual monthly CSV with columns month_end, <value column>."""
    df = pd.read_csv(path)
    if df.shape[1] < 2:
        raise ValueError(f"{path} needs two columns: month_end, value")
    dates = pd.to_datetime(df.iloc[:, 0], errors="raise")
    values = pd.to_numeric(df.iloc[:, 1], errors="raise")
    return pd.Series(values.to_numpy(dtype=float), index=pd.DatetimeIndex(dates))


# --------------------------------------------------------------------------- #
# Metadata
# --------------------------------------------------------------------------- #
def _obs_range(s: pd.Series) -> tuple[str, str]:
    s = s.dropna()
    if s.empty:
        return "", ""
    return str(s.index.min().date()), str(s.index.max().date())


def metadata_record(t: dict, s: pd.Series | None, retrieved_at: str, status: str, extra_note: str = "") -> dict:
    first, last = _obs_range(s) if s is not None else ("", "")
    notes = t.get("notes", "")
    if extra_note:
        notes = f"{extra_note} | {notes}" if notes else extra_note
    return {
        "target_name": t["target_name"],
        "source_name": t["source_name"],
        "series_id": t["series_id"],
        "source_url": t["source_url"],
        "unit": t["unit"],
        "frequency_original": t["frequency_original"],
        "frequency_model": t["frequency_model"],
        "seasonal_adjustment": t["seasonal_adjustment"],
        "observation_definition": t["observation_definition"],
        "publication_lag_or_availability_rule": t["publication_lag_or_availability_rule"],
        "first_observation": first,
        "last_observation": last,
        "retrieved_at": retrieved_at,
        "notes": notes,
        "is_proxy": t["is_proxy"],
        "status": status,
    }


def fx_metadata_record(cfg: dict, s: pd.Series | None, retrieved_at: str, source_label: str, status: str) -> dict:
    fx = cfg["fx"]
    first, last = _obs_range(s) if s is not None else ("", "")
    return {
        "target_name": "usdinr_daily (-> usdinr_month_end, shock)",
        "source_name": source_label,
        "series_id": fx["fred_series_id"] if "FRED" in source_label else fx["yahoo_ticker"],
        "source_url": fx["fred_url"],
        "unit": fx["unit"],
        "frequency_original": "daily",
        "frequency_model": "monthly (last available observation of each calendar month)",
        "seasonal_adjustment": "Not seasonally adjusted",
        "observation_definition": "Daily USD/INR; month-end value = last available daily observation in the month; "
                                  "shock = (month_end / prev_month_end - 1) * 100 (identical to Model 2)",
        "publication_lag_or_availability_rule": "Known at end of month",
        "first_observation": first,
        "last_observation": last,
        "retrieved_at": retrieved_at,
        "notes": "Shared FX definition. FRED DEXINUS = noon buying rates in New York (Federal Reserve H.10). "
                 "Raw file keeps all downloaded history; the pipeline applies start_date before computing shock.",
        "is_proxy": False,
        "status": status,
    }


# --------------------------------------------------------------------------- #
# Demo data (SYNTHETIC)
# --------------------------------------------------------------------------- #
def generate_demo_raw(raw_dir: Path, cfg: dict, seed: int = 42) -> dict[str, pd.Series]:
    """Write synthetic raw files in the same format as the real downloads.

    Everything here is randomly generated. It exists ONLY to exercise the code.
    """
    rng = np.random.default_rng(seed)
    days = pd.bdate_range("2004-06-01", "2025-12-31")
    log_ret = rng.normal(0.00008, 0.0028, len(days))
    usdinr = pd.Series(44.0 * np.exp(np.cumsum(log_ret)), index=days)

    monthly = usdinr.groupby(usdinr.index.to_period("M")).last()
    shock = (monthly / monthly.shift(1) - 1) * 100
    shock = shock.fillna(0.0)

    def first_of_month(period_idx):
        return period_idx.to_timestamp(how="start")

    n = len(monthly)
    # inflation index: mom% = 0.45 + 0.05*shock(t-1) + noise
    mom = 0.45 + 0.05 * shock.shift(1).fillna(0).to_numpy() + rng.normal(0, 0.25, n)
    cpi = pd.Series(100 * np.cumprod(1 + mom / 100), index=first_of_month(monthly.index))
    cpi = cpi["2005-01-01":"2025-01-01"]  # shorter on purpose (mimics a stale series)

    # 10y yield: AR(1) with a small lagged-shock term
    y = np.zeros(n)
    y[0] = 7.0
    sh = shock.to_numpy()
    for i in range(1, n):
        y[i] = 7.0 + 0.9 * (y[i - 1] - 7.0) + 0.04 * sh[i - 1] + rng.normal(0, 0.12)
    yld = pd.Series(y, index=first_of_month(monthly.index))["2011-12-01":"2025-11-01"]

    # step-wise policy-style rate
    rate = np.zeros(n)
    rate[0] = 6.0
    for i in range(1, n):
        step = rng.choice([-0.5, -0.25, 0, 0, 0, 0, 0, 0.25, 0.5], p=[.03, .04, .2, .2, .2, .13, .1, .06, .04])
        rate[i] = np.clip(rate[i - 1] + step + 0.02 * sh[i - 1], 3.0, 10.0)
    disc = pd.Series(np.round(rate * 4) / 4, index=first_of_month(monthly.index))["2005-01-01":"2022-07-01"]

    raw_dir.mkdir(parents=True, exist_ok=True)
    out = {"USDINR_daily": usdinr}
    pd.DataFrame({"date": usdinr.index, "value": usdinr.to_numpy()}).to_csv(raw_dir / "USDINR_daily.csv", index=False)
    for sid, ser in [("INDCPIALLMINMEI", cpi), ("INTDSRINM193N", disc), ("INDIRLTLT01STM", yld)]:
        pd.DataFrame({"date": ser.index, "value": ser.to_numpy()}).to_csv(raw_dir / f"{sid}.csv", index=False)
        out[sid] = ser
    (raw_dir / "DEMO_NOTICE.txt").write_text(
        "SYNTHETIC DEMO DATA generated with a random seed. Not real. File names mimic real series IDs only "
        "so the same code path can be exercised.\n", encoding="utf-8")
    return out


# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #
def main(demo: bool = False, config_path: str | None = None, run_preprocessing: bool = True) -> None:
    cfg = load_config(config_path)
    paths = get_paths(demo)
    demo_banner(demo)
    retrieved_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    records: list[dict] = []
    raw_dir = paths["raw"]
    successes = 0

    if demo:
        series = generate_demo_raw(raw_dir, cfg)
        records.append(fx_metadata_record(cfg, series["USDINR_daily"], retrieved_at,
                                          "SYNTHETIC DEMO (mimics FRED DEXINUS)", "demo_synthetic"))
        for t in cfg["targets"]:
            if not t["enabled"] or t["series_id"] not in series:
                continue
            rec = metadata_record(t, series[t["series_id"]], retrieved_at, "demo_synthetic",
                                  "SYNTHETIC DEMO DATA - NOT REAL")
            rec["source_name"] = f"SYNTHETIC DEMO (mimics {t['source_name']})"
            records.append(rec)
            successes += 1
    else:
        print("Downloading USD/INR ...")
        fx_series, fx_label = download_fx(cfg)
        pd.DataFrame({"date": fx_series.index, "value": fx_series.to_numpy()}).to_csv(
            raw_dir / "USDINR_daily.csv", index=False)
        records.append(fx_metadata_record(cfg, fx_series, retrieved_at, fx_label, "ok"))
        print(f"  USD/INR source used: {fx_label}  ({len(fx_series.dropna())} daily observations)")

        for t in cfg["targets"]:
            if not t["enabled"]:
                continue
            name = t["target_name"]
            try:
                if t["source_type"] == "fred":
                    s = fetch_fred_series(t["series_id"])
                elif t["source_type"] == "manual_csv":
                    p = PROJECT_ROOT / t["path"]
                    if not p.exists():
                        print(f"  [skip] {name}: manual file not found ({t['path']}) - target omitted.")
                        records.append(metadata_record(t, None, retrieved_at, "not_provided"))
                        continue
                    s = read_manual_csv(p)
                else:
                    raise ValueError(f"Unknown source_type {t['source_type']}")
                pd.DataFrame({"date": s.index, "value": s.to_numpy()}).to_csv(
                    raw_dir / f"{t['series_id']}.csv", index=False)
                rec = metadata_record(t, s, retrieved_at, "ok")
                records.append(rec)
                successes += 1
                print(f"  [ok] {name}: {rec['first_observation']} -> {rec['last_observation']}")
            except Exception as e:  # noqa: BLE001
                print(f"  [FAILED] {name}: {e}")
                records.append(metadata_record(t, None, retrieved_at, f"download_failed: {e}"))

    pd.DataFrame(records, columns=METADATA_COLUMNS).to_csv(paths["metadata"], index=False)
    print(f"Metadata written: {paths['metadata']}")

    if successes == 0:
        sys.exit("No macro target series could be collected. Nothing to model. See messages above.")

    if run_preprocessing:
        preprocessing.main(demo=demo, config_path=config_path)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--demo", action="store_true", help="generate SYNTHETIC demo data (not real)")
    ap.add_argument("--config", default=None)
    args = ap.parse_args()
    main(demo=args.demo, config_path=args.config)
