import os
# pyrefly: ignore [missing-import]
import joblib
import pandas as pd

from sklearn.ensemble import IsolationForest


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


class AnomalyModel:

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
            "anomaly_model.pkl"
        )

        self.model = None

        if os.path.exists(model_path):
            self.model = joblib.load(model_path)

    def predict(self, features):

        if self.model is None:

            return {
                "anomaly": False,
                "score": 0.0,
                "model_loaded": False
            }

        df = pd.DataFrame(
            [[features[f] for f in FEATURES]],
            columns=FEATURES
        )

        prediction = self.model.predict(df)[0]

        anomaly_score = self.model.decision_function(df)[0]

        return {
            "anomaly": prediction == -1,
            "score": round(
                float(anomaly_score),
                4
            ),
            "model_loaded": True
        }