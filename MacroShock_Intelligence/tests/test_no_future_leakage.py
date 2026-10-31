"""Features at origin month t must never use information from after t."""
import unittest

import numpy as np
import pandas as pd

from src.feature_engineering import build_supervised, feature_names
from src.utils import load_config, month_end_range


def make_panel(n=60, seed=1):
    idx = month_end_range("2010-01-31", "2014-12-31")[:n]
    rng = np.random.default_rng(seed)
    return pd.DataFrame({
        "month_end": idx,
        "usdinr_month_end": 50 + np.cumsum(rng.normal(0, 0.3, n)),
        "shock": rng.normal(0.3, 1.5, n),
        "tgt": np.arange(n, dtype=float) + rng.normal(0, 0.01, n),
    })


class TestNoFutureLeakage(unittest.TestCase):
    def setUp(self):
        self.cfg = load_config()
        self.panel = make_panel()
        self.panel.loc[0, "shock"] = np.nan  # first month has no shock

    def _tcfg(self, lag):
        return {"target_name": "tgt", "availability_lag_months": lag}

    def test_target_month_and_y_alignment(self):
        for h in (1, 3):
            sup = build_supervised(self.panel, self._tcfg(0), h, self.cfg)
            lookup = self.panel.set_index("month_end")["tgt"]
            labelled = sup[sup["y"].notna()]
            expected_tm = labelled["month_end"] + pd.offsets.MonthEnd(h)
            self.assertTrue((labelled["target_month"] == expected_tm).all())
            self.assertTrue(np.allclose(labelled["y"].to_numpy(), lookup.loc[labelled["target_month"]].to_numpy()))
            self.assertTrue((labelled["target_month"] > labelled["month_end"]).all())

    def test_changing_the_future_does_not_change_features(self):
        for lag in (0, 1):
            base = build_supervised(self.panel, self._tcfg(lag), 1, self.cfg)
            t0 = pd.Timestamp("2012-06-30")
            altered = self.panel.copy()
            future = altered["month_end"] > t0
            altered.loc[future, "shock"] = 999.0
            altered.loc[future, "tgt"] = -999.0
            alt = build_supervised(altered, self._tcfg(lag), 1, self.cfg)
            feats = feature_names(self.cfg, True)
            a = base[base["month_end"] <= t0].set_index("month_end")[feats]
            b = alt[alt["month_end"] <= t0].set_index("month_end")[feats]
            pd.testing.assert_frame_equal(a, b)

    def test_target_lag_respects_availability_lag(self):
        tgt = self.panel.set_index("month_end")["tgt"]
        for lag in (0, 1, 2):
            sup = build_supervised(self.panel, self._tcfg(lag), 1, self.cfg).set_index("month_end")
            t = sup.index[10]
            expected = tgt.shift(lag).loc[t]
            self.assertAlmostEqual(sup.loc[t, "target_lag_1"], expected)
            self.assertAlmostEqual(sup.loc[t, "target_lag_2"], tgt.shift(lag + 1).loc[t])

    def test_missing_values_are_dropped_not_filled(self):
        p = self.panel.copy()
        p.loc[30, "tgt"] = np.nan
        sup = build_supervised(p, self._tcfg(0), 1, self.cfg)
        feats = feature_names(self.cfg, True)
        self.assertFalse(sup[feats].isna().any().any())
        # origins 30..33 need target_lag values from month 30 -> must be absent
        gone = p.loc[30:32, "month_end"]
        self.assertFalse(sup["month_end"].isin(gone).any())

    def test_non_contiguous_panel_rejected(self):
        broken = self.panel.drop(index=20)
        with self.assertRaises(ValueError):
            build_supervised(broken, self._tcfg(0), 1, self.cfg)


if __name__ == "__main__":
    unittest.main()
