import os
import pandas as pd
# pyrefly: ignore [missing-import]
import joblib

from sklearn.ensemble import IsolationForest


BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)

DATA_PATH = os.path.join(
    BASE_DIR,
    "data",
    "training_data.csv"
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "anomaly_model.pkl"
)


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


def train():

    df = pd.read_csv(DATA_PATH)

    X = df[FEATURES]

    model = IsolationForest(
        n_estimators=200,
        contamination=0.1,
        random_state=42
    )

    model.fit(X)

    os.makedirs(
        os.path.dirname(MODEL_PATH),
        exist_ok=True
    )

    joblib.dump(
        model,
        MODEL_PATH
    )

    print(
        f"Anomaly model saved to {MODEL_PATH}"
    )


if __name__ == "__main__":
    train()