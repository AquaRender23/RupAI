"""The shared FX shock must match the Model 2 definition exactly."""
import tempfile
import unittest
from pathlib import Path

import numpy as np
import pandas as pd

from src.preprocessing import build_panel
from src.utils import compute_shock, load_config, to_monthly


class TestShockDefinition(unittest.TestCase):
    def setUp(self):
        # last observation of each month is deliberately NOT the last calendar day
        self.daily = pd.Series(
            [70.0, 71.0, 71.5, 72.0, 75.6],
            index=pd.to_datetime(["2020-01-15", "2020-01-29", "2020-02-10", "2020-02-27", "2020-03-31"]),
        )

    def test_month_end_is_last_observation_and_normalised_calendar_end(self):
        m = to_monthly(self.daily)
        self.assertEqual(list(m.values), [71.0, 72.0, 75.6])
        self.assertEqual(list(m.index), list(pd.to_datetime(["2020-01-31", "2020-02-29", "2020-03-31"])))
        self.assertEqual(m.index.name, "month_end")
        self.assertTrue(all(ts == ts.normalize() for ts in m.index))

    def test_shock_formula_and_sign(self):
        shock = compute_shock(to_monthly(self.daily))
        self.assertTrue(np.isnan(shock.iloc[0]))                       # first month has no prior month
        self.assertAlmostEqual(shock.iloc[1], (72.0 / 71.0 - 1) * 100)
        self.assertAlmostEqual(shock.iloc[2], 5.0, places=9)
        self.assertGreater(shock.iloc[2], 0)                           # USD/INR up = rupee depreciation = positive
        down = compute_shock(pd.Series([80.0, 78.0], index=pd.to_datetime(["2020-01-31", "2020-02-29"])))
        self.assertLess(down.iloc[1], 0)                               # rupee appreciation = negative

    def test_matches_pct_change_times_100(self):
        rng = np.random.default_rng(0)
        idx = pd.bdate_range("2010-01-01", "2012-12-31")
        s = pd.Series(50 * np.exp(np.cumsum(rng.normal(0, 0.003, len(idx)))), index=idx)
        m = to_monthly(s)
        pd.testing.assert_series_equal(compute_shock(m), (m.pct_change() * 100).rename("shock"))

    def test_config_dates_match_model2(self):
        cfg = load_config()
        self.assertEqual(cfg["start_date"], "2005-01-01")
        self.assertEqual(cfg["test_start"], "2018-01-01")
        self.assertEqual(cfg["fx"]["fred_series_id"], "DEXINUS")
        self.assertEqual(cfg["fx"]["yahoo_ticker"], "INR=X")

    def test_start_date_applied_before_shock(self):
        """Model 2 cuts at start_date first, so the first panel month must have NaN shock."""
        cfg = load_config()
        cfg["targets"] = [t for t in cfg["targets"] if t["series_id"] == "INDIRLTLT01STM"]
        with tempfile.TemporaryDirectory() as d:
            raw = Path(d)
            days = pd.bdate_range("2004-10-01", "2005-06-30")
            pd.DataFrame({"date": days, "value": np.linspace(44, 46, len(days))}).to_csv(raw / "USDINR_daily.csv", index=False)
            mdays = pd.date_range("2004-10-01", "2005-06-01", freq="MS")
            pd.DataFrame({"date": mdays, "value": 7.0}).to_csv(raw / "INDIRLTLT01STM.csv", index=False)
            panel, _ = build_panel(raw, cfg)
        self.assertEqual(panel["month_end"].iloc[0], pd.Timestamp("2005-01-31"))
        self.assertTrue(np.isnan(panel["shock"].iloc[0]))
        self.assertFalse(np.isnan(panel["shock"].iloc[1]))
        self.assertListEqual(list(panel.columns[:3]), ["month_end", "usdinr_month_end", "shock"])


if __name__ == "__main__":
    unittest.main()
