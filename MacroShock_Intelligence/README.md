# RupAI Model 1 — Macroeconomic Response Model

Estimates how selected Indian macroeconomic indicators (inflation, a policy-rate series, the 10-year G-Sec yield) behave **one month after** a monthly USD/INR shock, with p10 / p50 / p90 estimates.

> **This is an observational, predictive model. Differences between a scenario and the baseline are model-based and are NOT causal effects.** Not financial advice.

## Read this first: what is and is not in this ZIP

| Item | Status |
|---|---|
| Source code, config, tests, docs | Included, complete |
| **Real downloaded data** | **NOT included.** The ZIP was built in an environment with no internet access. You must run the download step. |
| `data/demo/`, `outputs/demo/` | **SYNTHETIC demo data** generated from a random seed, to show the code runs. Not real. Its metrics mean nothing. |
| Real-data results | **None exist yet.** No real performance numbers have been produced or are claimed. |
| Model 2 files | None included, none modified. |

## Quick start (Windows PowerShell, Python 3.10+, CPU only)

```powershell
cd RupAI_Model1
python -m pip install --upgrade pip
pip install -r requirements.txt

python -m src.data_collection      # downloads raw data, writes data/source_metadata.csv, builds the monthly panel
python -m src.train_model1         # trains, evaluates, writes outputs/ (also saves models/*.joblib)
```

Other commands:

```powershell
python -m src.evaluate                                   # recompute outputs/model1_eval.csv from outputs/model1_macro_predictions.csv
python -m src.predict_scenarios --shocks 5,8,10          # custom scenarios -> outputs/model1_scenarios_custom.csv
python -m src.predict_scenarios --shocks -3,0,5 --targets india_10y_gsec_yield_pct --horizon 1
python -m unittest discover -s tests -t . -v             # run tests (no pytest needed; `python -m pytest` also works if installed)

# Code-check only, with SYNTHETIC data (works offline):
python -m src.data_collection --demo
python -m src.train_model1 --demo
```

Timing: the full **demo** pipeline took about 3 seconds in the build environment (measured). Real-data download and training time has **not** been measured because the build environment had no network; expect the download to be a handful of small CSV requests.

## Data sources (checked against live catalogue pages on 31 Oct 2026)

| Role | Series | Source | Status / caveats |
|---|---|---|---|
| FX (shared with Model 2) | `DEXINUS` daily, INR per USD | FRED / Federal Reserve H.10 | Verified to exist (daily, rupees per USD); catalogue snapshots seen showed updates into 2026. Fallback: Yahoo Finance `INR=X` (`auto_adjust=True`), used automatically only if FRED fails; the source used is recorded in `data/source_metadata.csv`. |
| Inflation | `INDCPIALLMINMEI` (CPI index, 2015=100) | OECD MEI via FRED | Verified. **Likely stale:** the FRED copy was last updated May 2025 with data to about Jan 2025. YoY % is computed by this pipeline (source is an index). Check `last_observation` after download. |
| Policy rate (**proxy**) | `INTDSRINM193N` (IMF "Discount Rate", India) | IMF IFS via FRED | **Not the repo rate.** Values seen (4.25 in Mar 2022; 5.15 in Jun–Jul 2022) look like the RBI *Bank Rate* (repo + 0.25) — that is an inference to verify. FRED copy appeared to stop around **Jul 2022**. Flagged `is_proxy = True`. |
| 10-yr G-Sec yield | `INDIRLTLT01STM` | OECD MEI via FRED | Verified; coverage seen: Dec 2011 onward. Whether values are monthly averages or month-end is **not verified** (see metadata). |
| Repo rate (optional) | manual CSV | RBI | No automated RBI download was verified, so none is bundled. To enable: create `data/raw/manual/rbi_repo_rate_monthly.csv` with columns `month_end,repo_rate_pct` (end-of-month policy repo rate, from RBI). Skipped automatically if absent. |
| Import costs | — | — | **Excluded.** No India-specific monthly import-price series could be verified; only import *value* (USD) series were found, which are not prices. Nothing was substituted. |

Targets that will be modelled after a successful run: `india_cpi_inflation_pct`, `india_policy_discount_rate_pct` (proxy), `india_10y_gsec_yield_pct`, plus `india_repo_rate_pct` only if you supply the manual file. The run summary lists exactly what was trained or skipped and why.

Providers revise history; `retrieved_at` in the metadata lets you tell vintages apart between teammates.

## FX shock — compatibility with Model 2

Implemented in `src/utils.py` (`to_monthly`, `compute_shock`) exactly as described in the handoff's Model 2 reference:

- daily USD/INR cut to `>= 2005-01-01` **before** aggregation → last available observation per calendar month → `month_end` (normalised calendar month-end date)
- `shock = (USDINR_month_end / previous_month_end − 1) × 100`; first month = NaN; positive = rupee depreciation
- test period starts `2018-01-01`; FRED `DEXINUS` preferred, Yahoo `INR=X` fallback

**Important caveat:** the handoff document describes Model 2's code but I was not given `model2_pipeline.py` itself, so this match is to the *description*, not verified against the source. Please confirm once on real data (`model2_panel.csv` should contain `month_end` and `shock`; adjust names if different):

```powershell
python -c "import pandas as pd; a=pd.read_csv('data/processed/model1_macro_panel.csv',parse_dates=['month_end']).set_index('month_end')['shock'].dropna(); b=pd.read_csv('model2_panel.csv',parse_dates=['month_end']).drop_duplicates('month_end').set_index('month_end')['shock'].dropna(); j=pd.concat([a,b],axis=1,join='inner',keys=['m1','m2']); print(len(j),'shared months; max abs diff =',(j.m1-j.m2).abs().max())"
```

A difference near 0 means the shared shock matches. Differences can also come from FRED revisions or from Model 2 having fallen back to Yahoo.

## Model design

- **Frequency:** monthly. **Origin month t**, horizon `h` (default 1, set in `config.json` → `horizons_months`).
- **Target:** the *level* of the indicator at month t+h, in its own unit (no mixing of units).
- **Features** (listed per target in `outputs/model1_feature_manifest.json`): `shock`, `shock_lag_1..3`, `target_lag_1..3`.
  `target_lag_1` is the latest value *known* at month t (a target with availability lag L uses month t−L; CPI uses L=1). No other features; `usdinr_month_end` is stored in the panel for audit but not used as a feature (non-stationary level).
- **Models** (CPU, small data): persistence baseline (last known value; also the "no-change" baseline), linear regression, quantile regression q10/q50/q90 (scikit-learn, unregularised, HiGHS solver; sorted so p10 ≤ p50 ≤ p90), and quantile regression **without** the shock features, so you can see whether the FX shock adds anything.
- **Split:** chronological. Train = target month `< 2018-01-01`; test = target month `>= 2018-01-01`. A target with fewer than 60 training or 12 test rows is skipped with a stated reason; the split is never moved silently. No validation window or tuning is used because hyper-parameters are fixed.
- **No leakage / no filling:** no forward-fill, back-fill, interpolation, or zero-fill; incomplete rows are dropped. Fitted on train only (no scalers are used).

## Outputs (`outputs/`)

| File | Content |
|---|---|
| `model1_macro_predictions.csv` | Long format. `is_scenario=False` rows = held-out test predictions from every model (with `actual`). `is_scenario=True` rows = scenario grid from models refit on all labelled data. |
| `model1_eval.csv` | Per target × horizon × model on the test set: MAE, RMSE, pinball q10/q50/q90, 10–90 coverage, average interval width, `MAE_ratio_vs_persistence` (below 1 = beats persistence). Empty = metric not applicable (never 0). |
| `model1_feature_manifest.json` | Exact features and target definition per target. |
| `model1_run_summary.json` | Data mode, panel date range, split boundaries and counts, skipped targets, warnings, auto-generated "beats / does NOT beat persistence" statements, library versions. |
| `outputs/model1_scenarios_custom.csv` | From `predict_scenarios`. |

**Reading p10 / p50 / p90:** p50 is the median estimate; the p10–p90 band is an 80% prediction interval *if the model is well calibrated*. Check `coverage_10_90` in the eval file: near 0.80 is good; far from it means the band is mis-sized. Policy-style rates move in steps, so intervals can be extremely narrow or zero width.

**Scenarios:** `month_end` is the latest origin with complete inputs for that target; `target_month` = origin + horizon. `shock` in that row is replaced by the scenario value (lags stay observed). `baseline_prediction` is the model at shock = 0; `estimated_change_pXX` = scenario pXX − baseline pXX at the same quantile level. `outside_training_shock_range=True` means extrapolation, which is unsupported. `data_cutoff` differs by target; **a stale series produces a stale scenario origin** and the run prints a warning (the CPI and discount-rate series are expected to trigger it).

**Change the scenario:** edit `scenario_shocks_pct` in `config/config.json` and re-run training, or use `--shocks` with `predict_scenarios`. **Select targets/horizons:** set `"enabled": false` on a target, or edit `horizons_months` (e.g. `[1, 3, 6]`) in the config and re-train.

## If a data provider is unavailable

- FRED down → automatic Yahoo fallback for FX. If both fail, the run **stops** with a message; it never switches to synthetic data silently.
- A macro series fails → recorded as `download_failed` in the metadata, that target is omitted, and the others continue. Re-run later or supply the data manually.
- Behind a firewall → allow `fred.stlouisfed.org` (and Yahoo for the fallback).

## Future integration with Model 2 (not implemented; Model 2 is untouched)

Model 2's current code does not consume Model 1. For a future revision, join on `month_end` (same normalised month-end key) using explicit macro column names from `model1_macro_panel.csv`, and only use values available at prediction time (respect `availability_lag_months` in the config). Keep scenario rows (carrying `shock_pct`, `target_month`, `horizon_months`, `data_cutoff`) separate from observed history, and keep Model 2 runnable without Model 1.

## Known limitations

- Small monthly samples; a persistence baseline is hard to beat, and the model may not beat it. The run reports this honestly.
- Source series have coverage gaps (CPI around 2025, discount rate to mid-2022) and the policy rate is a proxy.
- Revisions, regime changes and other drivers (oil, global rates, policy) are not modelled.
- The CPI publication lag (1 month) is an assumption, not a sourced figure.

Project layout: `config/` · `data/{raw,processed,demo}` · `src/` · `models/` · `outputs/` · `tests/`. Column definitions: see `DATA_DICTIONARY.md`.
