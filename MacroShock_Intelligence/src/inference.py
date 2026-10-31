
"""
RupAI Model 1 - Inference Engine

Loads trained macroeconomic models and generates
scenario-based predictions for the backend.
"""

from functools import lru_cache

import joblib
import pandas as pd

from src.utils import get_paths
from src.predict_scenarios import predict_quantiles


class Model1Inference:

    def __init__(self, demo=False):

        self.paths = get_paths(demo)
        self.models = {}

        model_dir = self.paths["models"]

        # Load trained model bundles
        for model_file in model_dir.glob("*.joblib"):

            bundle = joblib.load(model_file)

            target = bundle["target_name"]
            horizon = int(bundle["horizon"])

            self.models[(target, horizon)] = bundle

        if not self.models:
            raise RuntimeError(
                f"No trained models found in: {model_dir}"
            )

    # --------------------------------------------------
    # 1. List available trained models
    # --------------------------------------------------

    def available_models(self):

        result = []

        for (target, horizon), bundle in self.models.items():

            result.append({
                "target": target,
                "horizon": horizon,
                "unit": bundle["target_unit"]
            })

        return result

    # --------------------------------------------------
    # 2. Generate predictions
    # --------------------------------------------------

    def predict(self, target, shock_pct, horizon=1):

        shock_pct = float(shock_pct)
        horizon = int(horizon)

        key = (target, horizon)

        if key not in self.models:

            raise ValueError(
                f"No trained model available for target "
                f"'{target}' and horizon '{horizon}'. "
                f"Available models: {self.available_models()}"
            )

        bundle = self.models[key]

        features = bundle["features"]
        origin = bundle["origin_features"]

        if "shock" not in features:

            raise ValueError(
                "The trained model does not contain a shock feature."
            )

        # Create baseline input (zero shock)
        baseline_input = pd.DataFrame([
            {feature: origin[feature] for feature in features}
        ])

        baseline_input.loc[0, "shock"] = 0.0

        # Create scenario input
        scenario_input = baseline_input.copy()

        scenario_input.loc[0, "shock"] = shock_pct

        # Predict quantiles
        quantiles = [0.1, 0.5, 0.9]

        baseline_quantiles = predict_quantiles(
            bundle["qmodels"],
            baseline_input,
            quantiles
        )[0]

        scenario_quantiles = predict_quantiles(
            bundle["qmodels"],
            scenario_input,
            quantiles
        )[0]

        # Linear regression prediction
        linear_prediction = float(
            bundle["lr"].predict(scenario_input)[0]
        )

        # Convert predictions to Python floats
        baseline_p10 = float(baseline_quantiles[0])
        baseline_p50 = float(baseline_quantiles[1])
        baseline_p90 = float(baseline_quantiles[2])

        p10 = float(scenario_quantiles[0])
        p50 = float(scenario_quantiles[1])
        p90 = float(scenario_quantiles[2])

        # Check whether the scenario is outside training range
        train_min = float(bundle["train_shock_min"])
        train_max = float(bundle["train_shock_max"])

        outside_range = (
            shock_pct < train_min or shock_pct > train_max
        )

        # Build response
        response = {

            "target": target,

            "unit": bundle["target_unit"],

            "horizon_months": horizon,

            "scenario": {
                "shock_pct": shock_pct
            },

            "predictions": {
                "p10": p10,
                "p50": p50,
                "p90": p90,
                "linear_regression": linear_prediction
            },

            "baseline": {
                "p10": baseline_p10,
                "p50": baseline_p50,
                "p90": baseline_p90
            },

            "estimated_change": {
                "p10": p10 - baseline_p10,
                "p50": p50 - baseline_p50,
                "p90": p90 - baseline_p90
            },

            "metadata": {
                "origin_month": str(bundle["origin_month"]),
                "target_month": str(bundle["scenario_target_month"]),
                "model_train_end": str(bundle["model_train_end"]),
                "data_mode": bundle["data_mode"],
                "source_version": bundle["source_version"]
            },

            "extrapolation": {
                "outside_training_range": outside_range,
                "training_shock_min": train_min,
                "training_shock_max": train_max
            },

            "disclaimer": (
                "These are model-based scenario estimates. "
                "Estimated changes are not causal effects "
                "or financial advice."
            )
        }

        return response


# --------------------------------------------------
# 3. Reuse one loaded inference engine
# --------------------------------------------------

@lru_cache(maxsize=1)
def get_inference_engine():

    return Model1Inference(demo=False)


# --------------------------------------------------
# 4. Optional command-line test
# --------------------------------------------------

if __name__ == "__main__":

    engine = get_inference_engine()

    print("\nAVAILABLE MODELS")
    print("----------------")

    for model in engine.available_models():
        print(model)

    print("\nSAMPLE PREDICTION")
    print("----------------")

    result = engine.predict(
        target="india_cpi_inflation_pct",
        shock_pct=5,
        horizon=1
    )

    import json

    print(json.dumps(result, indent=4))
