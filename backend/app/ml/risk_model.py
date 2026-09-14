# Risk Model
import os
# pyrefly: ignore [missing-import]
import joblib
import pandas as pd


FEATURES = [
    "critical_cves",
    "high_cves",
    "medium_cves",
    "low_cves",
    "package_count",
    "image_size_mb",
    "is_signed",
    "signature_verified"
]


class RiskModel:

    def __init__(self):

        base_dir = os.path.dirname(
            os.path.dirname(
                os.path.dirname(
                    os.path.abspath(__file__)
                )
            )
        )

        model_path = os.path.join(
            base_dir,
            "models",
            "risk_model.pkl"
        )

        self.model = None

        if os.path.exists(model_path):
            self.model = joblib.load(model_path)

    def predict(self, features):

        if self.model is None:

            return {
                "prediction": "UNKNOWN",
                "confidence": 0.0,
                "model_loaded": False
            }

        df = pd.DataFrame(
            [[features[f] for f in FEATURES]],
            columns=FEATURES
        )

        prediction = self.model.predict(df)[0]

        probabilities = self.model.predict_proba(df)[0]

        confidence = float(
            max(probabilities)
        )

        return {
            "prediction": str(prediction),
            "confidence": round(
                confidence,
                4
            ),
            "model_loaded": True
        }