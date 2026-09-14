import os
import pandas as pd
# pyrefly: ignore [missing-import]
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report


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
    "risk_model.pkl"
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
    y = df["risk_label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=200,
        random_state=42,
        class_weight="balanced"
    )

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    print(
        classification_report(
            y_test,
            predictions
        )
    )

    os.makedirs(
        os.path.dirname(MODEL_PATH),
        exist_ok=True
    )

    joblib.dump(
        model,
        MODEL_PATH
    )

    print(
        f"Model saved to {MODEL_PATH}"
    )


if __name__ == "__main__":
    train()