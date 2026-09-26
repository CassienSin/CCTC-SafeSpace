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


# --------------------------------------------------
# Paths
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

TRAIN_PATH = BASE_DIR / "dataset" / "train.csv"
TEST_PATH = BASE_DIR / "dataset" / "test.csv"

MODEL_DIR = BASE_DIR / "model"
MODEL_PATH = MODEL_DIR / "incident_classifier.joblib"


# --------------------------------------------------
# Load datasets
# --------------------------------------------------

print("Loading datasets...")

train_df = pd.read_csv(TRAIN_PATH)
test_df = pd.read_csv(TEST_PATH)

# Remove rows with missing values
train_df = train_df.dropna(subset=["text", "category"])
test_df = test_df.dropna(subset=["text", "category"])

# Make sure everything is treated as text
train_df["text"] = train_df["text"].astype(str).str.strip()
train_df["category"] = train_df["category"].astype(str).str.strip()

test_df["text"] = test_df["text"].astype(str).str.strip()
test_df["category"] = test_df["category"].astype(str).str.strip()


# --------------------------------------------------
# Dataset information
# --------------------------------------------------

print(f"\nTraining examples: {len(train_df)}")
print(f"Testing examples: {len(test_df)}")

print("\nTraining category distribution:")
print(train_df["category"].value_counts().sort_index())

print("\nTesting category distribution:")
print(test_df["category"].value_counts().sort_index())


# --------------------------------------------------
# Prepare training and testing data
# --------------------------------------------------

X_train = train_df["text"]
y_train = train_df["category"]

X_test = test_df["text"]
y_test = test_df["category"]


# --------------------------------------------------
# Create TF-IDF + Logistic Regression model
# --------------------------------------------------

model = Pipeline(
    [
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
    ]
)


# --------------------------------------------------
# Train model
# --------------------------------------------------

print("\nTraining model...")

model.fit(X_train, y_train)

print("Training complete.")


# --------------------------------------------------
# Evaluate model
# --------------------------------------------------

print("\nEvaluating model...")

y_pred = model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)

print("\n" + "=" * 60)
print("MODEL EVALUATION")
print("=" * 60)

print(f"\nAccuracy: {accuracy:.2%}")


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

labels = sorted(train_df["category"].unique())

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
# Save trained model
# --------------------------------------------------

MODEL_DIR.mkdir(parents=True, exist_ok=True)

joblib.dump(model, MODEL_PATH)

print("\n" + "=" * 60)
print("MODEL SAVED")
print("=" * 60)

print(f"\nModel saved to:")
print(MODEL_PATH)

print("\nDone!")