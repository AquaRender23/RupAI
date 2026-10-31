"""Run the whole pipeline on SYNTHETIC data in a temp folder and check output contracts."""
import tempfile
import unittest
from pathlib import Path

import numpy as np
import pandas as pd

from src import evaluate as ev
from src.data_collection import generate_demo_raw
from src.predict_scenarios import PRED_COLUMNS
from src.preprocessing import build_panel
from src.train_model1 import run_pipeline
from src.utils import load_config, read_json


class TestSchema(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        root = Path(cls.tmp.name)
        cls.paths = {k: root / k for k in ("raw", "processed", "models", "outputs")}
        for p in cls.paths.values():
            p.mkdir()
        cls.cfg = load_config()
        generate_demo_raw(cls.paths["raw"], cls.cfg)
        cls.panel, _ = build_panel(cls.paths["raw"], cls.cfg, allow_manual=False)
        cls.summary = run_pipeline(cls.cfg, cls.panel, cls.paths, demo=True)
        cls.pred = pd.read_csv(cls.paths["outputs"] / "model1_macro_predictions.csv")
        cls.eval = pd.read_csv(cls.paths["outputs"] / "model1_eval.csv")

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def test_panel_schema(self):
        self.assertListEqual(list(self.panel.columns[:3]), ["month_end", "usdinr_month_end", "shock"])
        self.assertTrue(self.panel["month_end"].dt.is_month_end.all())
        self.assertTrue(self.panel["month_end"].is_monotonic_increasing)
        self.assertTrue(np.isnan(self.panel["shock"].iloc[0]))

    def test_prediction_columns_and_flags(self):
        self.assertListEqual(list(self.pred.columns), PRED_COLUMNS)
        self.assertTrue(set(self.pred["is_scenario"]) == {True, False})
        self.assertTrue((self.pred["data_mode"] == "DEMO_SYNTHETIC").all())
        scen = self.pred[self.pred["is_scenario"]]
        for c in ("shock_pct", "target_month", "horizon_months", "data_cutoff", "baseline_prediction"):
            self.assertFalse(scen[c].isna().any(), c)
        self.assertTrue(scen["actual"].isna().all())
        hist = self.pred[~self.pred["is_scenario"]]
        self.assertFalse(hist["actual"].isna().any())

    def test_quantile_ordering(self):
        q = self.pred.dropna(subset=["p10", "p90"])
        self.assertGreater(len(q), 0)
        self.assertTrue((q["p10"] <= q["p50"]).all())
        self.assertTrue((q["p50"] <= q["p90"]).all())

    def test_scenario_change_consistent(self):
        s = self.pred[self.pred["is_scenario"] & (self.pred["model_name"] == "quantile_regression")]
        self.assertTrue(np.allclose(s["estimated_change_p50"], s["scenario_prediction_p50"] - s["baseline_prediction"]))
        zero = s[s["shock_pct"] == 0]
        self.assertTrue(np.allclose(zero["estimated_change_p50"], 0.0))

    def test_chronological_split(self):
        test_start = pd.Timestamp(self.cfg["test_start"])
        hist = self.pred[~self.pred["is_scenario"]]
        self.assertTrue((pd.to_datetime(hist["target_month"]) >= test_start).all())
        self.assertTrue((pd.to_datetime(hist["model_train_end"]) < test_start).all())
        for info in self.summary["split_info"].values():
            self.assertLess(pd.Timestamp(info["train_end"]), pd.Timestamp(info["test_start"]))
            self.assertGreaterEqual(pd.Timestamp(info["test_start"]), test_start)

    def test_eval_schema_and_nan_not_zero(self):
        self.assertListEqual(list(self.eval.columns), ev.EVAL_COLUMNS)
        pers = self.eval[self.eval["model_name"] == "persistence"]
        self.assertTrue(pers["pinball_q10"].isna().all() and pers["coverage_10_90"].isna().all())
        qr = self.eval[self.eval["model_name"] == "quantile_regression"]
        self.assertFalse(qr["coverage_10_90"].isna().any())
        self.assertTrue(((qr["coverage_10_90"] >= 0) & (qr["coverage_10_90"] <= 1)).all())

    def test_eval_recomputable_from_predictions_file(self):
        info = read_json(self.paths["outputs"] / "model1_run_summary.json")["split_info"]
        again = ev.compute_eval(self.pred, info, "DEMO_SYNTHETIC")
        pd.testing.assert_frame_equal(again.reset_index(drop=True), self.eval.reset_index(drop=True),
                                      check_dtype=False, rtol=1e-9)

    def test_run_summary_and_manifest_exist(self):
        for f in ("model1_run_summary.json", "model1_feature_manifest.json"):
            self.assertTrue((self.paths["outputs"] / f).exists())
        self.assertIn("DEMO", " ".join(self.summary["caveats"]))
        self.assertTrue(any(m["target_unit"] for m in read_json(self.paths["outputs"] / "model1_feature_manifest.json").values()))


if __name__ == "__main__":
    unittest.main()
