from pathlib import Path

import joblib
import pandas as pd

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)
from sklearn.pipeline import Pipeline


BASE_DIR = Path(__file__).resolve().parent.parent

TRAIN_PATH = BASE_DIR / "dataset" / "severity_train.csv"
TEST_PATH = BASE_DIR / "dataset" / "severity_test.csv"

MODEL_DIR = BASE_DIR / "model"
MODEL_PATH = MODEL_DIR / "severity_classifier.joblib"


# --------------------------------------------------
# Load datasets
# --------------------------------------------------

print("Loading severity datasets...")

train_df = pd.read_csv(TRAIN_PATH)
test_df = pd.read_csv(TEST_PATH)

train_df = train_df.dropna(
    subset=["text", "severity"]
)

test_df = test_df.dropna(
    subset=["text", "severity"]
)

train_df["text"] = (
    train_df["text"]
    .astype(str)
    .str.strip()
)

train_df["severity"] = (
    train_df["severity"]
    .astype(str)
    .str.strip()
)

test_df["text"] = (
    test_df["text"]
    .astype(str)
    .str.strip()
)

test_df["severity"] = (
    test_df["severity"]
    .astype(str)
    .str.strip()
)


print(f"\nTraining examples: {len(train_df)}")
print(f"Testing examples: {len(test_df)}")


# --------------------------------------------------
# Show distributions
# --------------------------------------------------

print("\nTraining severity distribution:")
print(
    train_df["severity"]
    .value_counts()
    .sort_index()
)

print("\nTesting severity distribution:")
print(
    test_df["severity"]
    .value_counts()
    .sort_index()
)


# --------------------------------------------------
# Prepare data
# --------------------------------------------------

X_train = train_df["text"]
y_train = train_df["severity"]

X_test = test_df["text"]
y_test = test_df["severity"]


# --------------------------------------------------
# Create model
# --------------------------------------------------

model = Pipeline([
    (
        "tfidf",
        TfidfVectorizer(
            lowercase=True,
            ngram_range=(1, 2),
            sublinear_tf=True,
        ),
    ),
    (
        "classifier",
        LogisticRegression(
            max_iter=2000,
            random_state=42,
        ),
    ),
])


# --------------------------------------------------
# Train
# --------------------------------------------------

print("\nTraining severity model...")

model.fit(
    X_train,
    y_train,
)

print("Training complete.")


# --------------------------------------------------
# Evaluate
# --------------------------------------------------

print("\nEvaluating severity model...")

y_pred = model.predict(X_test)

accuracy = accuracy_score(
    y_test,
    y_pred,
)


print("\n" + "=" * 60)
print("SEVERITY MODEL EVALUATION")
print("=" * 60)

print(
    f"\nAccuracy: {accuracy:.2%}"
)


# --------------------------------------------------
# Classification report
# --------------------------------------------------

print("\nClassification Report:")

print(
    classification_report(
        y_test,
        y_pred,
        zero_division=0,
    )
)


# --------------------------------------------------
# Confusion matrix
# --------------------------------------------------

labels = sorted(
    train_df["severity"].unique()
)

matrix = confusion_matrix(
    y_test,
    y_pred,
    labels=labels,
)


print("\nConfusion Matrix:")

print("Labels:")
print(labels)

print("\nMatrix:")
print(matrix)


# --------------------------------------------------
# Save model
# --------------------------------------------------

MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True,
)

joblib.dump(
    model,
    MODEL_PATH,
)


print("\n" + "=" * 60)
print("SEVERITY MODEL SAVED")
print("=" * 60)

print(
    f"\nModel saved to:\n{MODEL_PATH}"
)

print("\nDone!")