"""Exercise the live-download code path WITHOUT internet by mocking HTTP."""
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import numpy as np
import pandas as pd

from src import data_collection as dc
from src.utils import load_config


class FakeResp:
    def __init__(self, text):
        self.text = text

    def raise_for_status(self):
        pass


class TestFredParsing(unittest.TestCase):
    def test_new_header_and_dot_missing(self):
        csv = "observation_date,DEXINUS\n2020-01-02,71.5\n2020-01-03,.\n2020-01-06,72.0\n"
        with mock.patch("requests.get", return_value=FakeResp(csv)):
            s = dc.fetch_fred_series("DEXINUS", retries=1)
        self.assertEqual(len(s), 3)
        self.assertTrue(np.isnan(s.iloc[1]))          # '.' -> NaN, never 0
        self.assertEqual(s.iloc[2], 72.0)

    def test_old_header(self):
        csv = "DATE,INDIRLTLT01STM\n2020-01-01,6.5\n2020-02-01,6.4\n"
        with mock.patch("requests.get", return_value=FakeResp(csv)):
            s = dc.fetch_fred_series("INDIRLTLT01STM", retries=1)
        self.assertEqual(list(s.values), [6.5, 6.4])

    def test_empty_series_raises(self):
        csv = "observation_date,X\n2020-01-01,.\n"
        with mock.patch("requests.get", return_value=FakeResp(csv)), mock.patch("time.sleep"):
            with self.assertRaises(RuntimeError):
                dc.fetch_fred_series("X", retries=1)


class TestMainRealModePaths(unittest.TestCase):
    def _run(self, fx_side_effect, macro_side_effect):
        cfg = load_config()
        tmp = tempfile.TemporaryDirectory()
        root = Path(tmp.name)
        paths = {"raw": root / "raw", "processed": root / "proc", "models": root / "m",
                 "outputs": root / "o", "metadata": root / "meta.csv"}
        for k in ("raw", "processed", "models", "outputs"):
            paths[k].mkdir()
        return cfg, tmp, paths

    def test_fx_failure_stops_run_no_synthetic_fallback(self):
        cfg, tmp, paths = self._run(None, None)
        with mock.patch.object(dc, "get_paths", return_value=paths), \
             mock.patch.object(dc, "fetch_fred_series", side_effect=RuntimeError("blocked")), \
             mock.patch.object(dc, "fetch_yahoo_usdinr", side_effect=RuntimeError("blocked")):
            with self.assertRaises(SystemExit) as cm:
                dc.main(demo=False)
        self.assertIn("NOT substitute synthetic", str(cm.exception))
        tmp.cleanup()

    def test_macro_failure_recorded_and_others_continue(self):
        cfg, tmp, paths = self._run(None, None)
        idx = pd.bdate_range("2004-01-01", "2010-12-31")
        fx = pd.Series(np.linspace(44, 50, len(idx)), index=idx)
        months = pd.date_range("2003-01-01", "2010-12-01", freq="MS")
        ok = pd.Series(np.linspace(6, 8, len(months)), index=months)

        def fake_fred(sid, **kw):
            if sid == "DEXINUS":
                return fx
            if sid == "INDIRLTLT01STM":
                return ok
            raise RuntimeError("simulated outage")

        with mock.patch.object(dc, "get_paths", return_value=paths), \
             mock.patch("src.preprocessing.get_paths", return_value=paths), \
             mock.patch.object(dc, "fetch_fred_series", side_effect=fake_fred):
            dc.main(demo=False)
        meta = pd.read_csv(paths["metadata"])
        status = dict(zip(meta["series_id"], meta["status"]))
        self.assertEqual(status["DEXINUS"], "ok")
        self.assertEqual(status["INDIRLTLT01STM"], "ok")
        self.assertTrue(status["INDCPIALLMINMEI"].startswith("download_failed"))
        self.assertEqual(status["RBI_REPO_MANUAL"], "not_provided")
        self.assertEqual(list(meta.columns), dc.METADATA_COLUMNS)
        panel = pd.read_csv(paths["processed"] / "model1_macro_panel.csv")
        self.assertIn("india_10y_gsec_yield_pct", panel.columns)
        self.assertNotIn("india_cpi_inflation_pct", panel.columns)   # failed series is absent, not zero-filled
        tmp.cleanup()


if __name__ == "__main__":
    unittest.main()
