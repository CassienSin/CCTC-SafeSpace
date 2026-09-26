from pathlib import Path

import pandas as pd


# --------------------------------------------------
# Paths
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

SOURCE_PATH = BASE_DIR / "dataset" / "incidents.csv"
TRAIN_PATH = BASE_DIR / "dataset" / "train.csv"
TEST_PATH = BASE_DIR / "dataset" / "test.csv"


# --------------------------------------------------
# Settings
# --------------------------------------------------

RANDOM_STATE = 42

CATEGORIES = [
    "bullying",
    "cyberbullying",
    "discrimination",
    "harassment",
    "other",
    "self_harm",
    "threat",
    "violence",
]


# --------------------------------------------------
# Load original dataset
# --------------------------------------------------

print("Loading original dataset...")

df = pd.read_csv(SOURCE_PATH)

df = df.dropna(subset=["text", "category"])

df["text"] = df["text"].astype(str).str.strip()
df["category"] = df["category"].astype(str).str.strip()


# --------------------------------------------------
# Validate categories
# --------------------------------------------------

print("\nCategory distribution:")

print(
    df["category"]
    .value_counts()
    .sort_index()
)


missing_categories = set(CATEGORIES) - set(df["category"].unique())

if missing_categories:
    raise ValueError(
        f"Missing categories: {sorted(missing_categories)}"
    )


# --------------------------------------------------
# Split original dataset
# --------------------------------------------------
#
# We reserve 20% of the original examples for testing.
#
# Because there are 20 examples per category:
#
#   16 → training
#    4 → testing
#
# The remaining training examples will later be
# expanded with additional examples.
# --------------------------------------------------

train_parts = []
test_parts = []

for category in CATEGORIES:

    category_df = df[
        df["category"] == category
    ].sample(
        frac=1,
        random_state=RANDOM_STATE,
    )

    test_part = category_df.iloc[:4]
    train_part = category_df.iloc[4:]

    test_parts.append(test_part)
    train_parts.append(train_part)


# --------------------------------------------------
# Combine datasets
# --------------------------------------------------

train_df = pd.concat(
    train_parts,
    ignore_index=True,
)

test_df = pd.concat(
    test_parts,
    ignore_index=True,
)


# --------------------------------------------------
# Shuffle datasets
# --------------------------------------------------

train_df = train_df.sample(
    frac=1,
    random_state=RANDOM_STATE,
).reset_index(drop=True)

test_df = test_df.sample(
    frac=1,
    random_state=RANDOM_STATE,
).reset_index(drop=True)


# --------------------------------------------------
# Save datasets
# --------------------------------------------------

TRAIN_PATH.parent.mkdir(
    parents=True,
    exist_ok=True,
)

train_df.to_csv(
    TRAIN_PATH,
    index=False,
)

test_df.to_csv(
    TEST_PATH,
    index=False,
)


# --------------------------------------------------
# Display results
# --------------------------------------------------

print("\n" + "=" * 60)
print("DATASET PREPARATION COMPLETE")
print("=" * 60)

print(f"\nTraining examples: {len(train_df)}")
print(f"Testing examples:  {len(test_df)}")

print("\nTraining distribution:")
print(
    train_df["category"]
    .value_counts()
    .sort_index()
)

print("\nTesting distribution:")
print(
    test_df["category"]
    .value_counts()
    .sort_index()
)

print("\nFiles created:")

print(TRAIN_PATH)
print(TEST_PATH)

print("\nDone!")