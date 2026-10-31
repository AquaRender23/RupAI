# RupAI Model 1 — Data Dictionary

All dates are normalised calendar month-end dates (`YYYY-MM-DD`), the same convention as Model 2's `month_end`.

## data/processed/model1_macro_panel.csv (one row per month)

| Column | Unit | Meaning |
|---|---|---|
| `month_end` | date | Month-end key (join key with Model 2). |
| `usdinr_month_end` | INR per USD | Last available daily USD/INR observation in the month (FRED DEXINUS, else Yahoo INR=X). |
| `shock` | percent | `(usdinr_month_end / previous_month_end − 1) × 100`. Positive = rupee depreciation. First month empty. Identical definition to Model 2. |
| `india_cpi_inflation_pct` | percent, YoY | `(CPI_t / CPI_t−12 − 1) × 100` from OECD CPI index (FRED `INDCPIALLMINMEI`). Empty where unavailable. |
| `india_policy_discount_rate_pct` | percent p.a. | **Proxy.** IMF IFS India discount rate (FRED `INTDSRINM193N`); not the repo rate. |
| `india_10y_gsec_yield_pct` | percent p.a. | OECD 10-year government bond yield (FRED `INDIRLTLT01STM`). |
| `india_repo_rate_pct` | percent p.a. | Only present if the optional manual RBI CSV is supplied. |

Macro columns are present only if the series was actually collected. Empty cells mean missing; nothing is filled or set to zero.

## data/source_metadata.csv

`target_name, source_name, series_id, source_url, unit, frequency_original, frequency_model, seasonal_adjustment, observation_definition, publication_lag_or_availability_rule, first_observation, last_observation, retrieved_at, notes, is_proxy, status`.
The shipped file has the static fields only (`status = not_yet_downloaded`; first/last observation and `retrieved_at` blank). `python -m src.data_collection` fills them. `status` is `ok`, `not_provided`, `download_failed: <reason>` or `demo_synthetic`.

## outputs/model1_macro_predictions.csv

| Column | Meaning |
|---|---|
| `month_end` | Forecast **origin** month (inputs known through this month). |
| `target_month` | Month the estimate refers to = origin + `horizon_months`. |
| `target_name`, `target_unit` | Stable target id and its unit. |
| `horizon_months` | Forecast horizon. |
| `shock_pct` | Observed shock at the origin (test rows) or the scenario shock (scenario rows), percent. |
| `p10`, `p50`, `p90` | Lower / median / upper estimate of the target **level** (target unit). Empty for p10/p90 on non-quantile models. For `persistence` and `linear_regression`, `p50` holds the point forecast. |
| `actual` | Observed target level at `target_month` (test rows only; empty for scenarios). |
| `model_name` | `persistence`, `linear_regression`, `quantile_regression`, `quantile_regression_no_shock`. |
| `is_scenario` | `False` = held-out historical prediction (model trained before the test start); `True` = hypothetical scenario (model refit on all labelled data). Never mix them. |
| `data_cutoff` | Latest month whose data were used as input (test rows: the origin month; scenarios: the latest usable origin for that target). |
| `model_train_end` | Last target month in the model's training data. |
| `source_version` | `model1-v<version>|<data_mode>|panel_last=<date>`. |
| `data_mode` | `real` or `DEMO_SYNTHETIC`. |
| `outside_training_shock_range` | Scenario rows: `True` if the shock lies outside the training range (extrapolation). |
| `baseline_prediction` | Scenario rows: model prediction at shock = 0 (p50 for quantile model; point forecast for linear regression). |
| `scenario_prediction_p10/p50/p90` | Scenario rows: same values as `p10/p50/p90`, stated explicitly. |
| `estimated_change_p10/p50/p90` | Scenario rows: scenario value minus baseline value at the same quantile level. A model difference, not a causal effect. |

## outputs/model1_eval.csv

`target_name, target_unit, horizon_months, model_name, split, n, train_start, train_end, test_start, test_end` (dates refer to **target months**), `MAE, RMSE` (central estimate), `pinball_q10, pinball_q50, pinball_q90, coverage_10_90, avg_interval_width` (quantile models only; empty otherwise), `MAE_ratio_vs_persistence` (below 1 = lower MAE than persistence), `data_mode`.

## Feature definitions (origin month t, target availability lag L, horizon h)

| Feature | Definition |
|---|---|
| `shock` | USD/INR month-end % change in month t |
| `shock_lag_k` | same, for month t−k (k = 1..3) |
| `target_lag_1` | target value at month t−L (latest value known at t) |
| `target_lag_k` | target value at month t−L−(k−1) |
| `y` (not a feature) | target value at month t+h |
