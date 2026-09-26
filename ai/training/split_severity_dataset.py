from pathlib import Path

import pandas as pd
from sklearn.model_selection import train_test_split


BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_PATH = BASE_DIR / "dataset" / "severity.csv"

TRAIN_PATH = BASE_DIR / "dataset" / "severity_train.csv"
TEST_PATH = BASE_DIR / "dataset" / "severity_test.csv"


print("Loading severity dataset...")

df = pd.read_csv(DATASET_PATH)

df = df.dropna(subset=["text", "severity"])

df["text"] = (
    df["text"]
    .astype(str)
    .str.strip()
)

df["severity"] = (
    df["severity"]
    .astype(str)
    .str.strip()
)


print(f"\nTotal examples: {len(df)}")

print("\nFull dataset distribution:")
print(
    df["severity"]
    .value_counts()
    .sort_index()
)


# 80% training / 20% testing
train_df, test_df = train_test_split(
    df,
    test_size=0.20,
    random_state=42,
    stratify=df["severity"],
)


train_df = train_df.sample(
    frac=1,
    random_state=42
).reset_index(drop=True)

test_df = test_df.sample(
    frac=1,
    random_state=42
).reset_index(drop=True)


train_df.to_csv(
    TRAIN_PATH,
    index=False
)

test_df.to_csv(
    TEST_PATH,
    index=False
)


print("\n" + "=" * 60)
print("SEVERITY DATASET SPLIT")
print("=" * 60)

print(f"\nTraining examples: {len(train_df)}")
print(f"Testing examples: {len(test_df)}")

print("\nTraining distribution:")
print(
    train_df["severity"]
    .value_counts()
    .sort_index()
)

print("\nTesting distribution:")
print(
    test_df["severity"]
    .value_counts()
    .sort_index()
)

print("\nFiles saved:")

print(f"Training:")
print(TRAIN_PATH)

print(f"\nTesting:")
print(TEST_PATH)

print("\nDone!")