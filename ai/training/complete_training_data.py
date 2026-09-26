from pathlib import Path

import pandas as pd


BASE_DIR = Path(__file__).resolve().parent.parent
TRAIN_PATH = BASE_DIR / "dataset" / "train.csv"


ADDITIONAL_EXAMPLES = {
    "discrimination": [
        "A teacher treated me differently because of my cultural background.",
        "My classmates exclude me from activities because of my nationality.",
        "I was denied participation because of my gender.",
        "Students make negative comments about my religious background.",
    ],

    "harassment": [
        "A student repeatedly makes unwanted comments toward me in the hallway.",
    ],

    "other": [
        "I need assistance because I left my school materials somewhere on campus.",
        "I want to report a problem with a classroom facility.",
        "My school belongings were misplaced and I need help finding them.",
        "I need help resolving an issue with my school schedule.",
        "I would like to ask for assistance with a general school concern.",
    ],

    "self_harm": [
        "I have been thinking about hurting myself and need someone to talk to.",
        "I am struggling with thoughts of self-injury and want to get help.",
        "I have thoughts about harming myself when I feel overwhelmed.",
    ],

    "violence": [
        "A student physically attacked me during an argument.",
        "Someone pushed and hit me near the school entrance.",
        "A classmate threatened me and then physically assaulted me.",
        "I was injured after another student attacked me.",
    ],
}


print("Loading training dataset...")

df = pd.read_csv(TRAIN_PATH)

print(f"Current training examples: {len(df)}")

existing_texts = set(
    df["text"]
    .astype(str)
    .str.strip()
    .str.lower()
)

rows_to_add = []

for category, examples in ADDITIONAL_EXAMPLES.items():

    added = 0

    for text in examples:

        normalized = text.strip().lower()

        if normalized in existing_texts:
            print(
                f"Skipping duplicate: {category} -> {text}"
            )
            continue

        rows_to_add.append(
            {
                "text": text,
                "category": category,
            }
        )

        existing_texts.add(normalized)
        added += 1

    print(
        f"{category}: added {added} examples"
    )


if not rows_to_add:
    raise ValueError(
        "No new examples were added."
    )


new_df = pd.DataFrame(rows_to_add)

df = pd.concat(
    [df, new_df],
    ignore_index=True,
)

print("\n" + "=" * 60)
print("TRAINING DATA COMPLETION")
print("=" * 60)

print(f"\nExamples added: {len(new_df)}")
print(f"Final training examples: {len(df)}")

print("\nFinal category distribution:")

print(
    df["category"]
    .value_counts()
    .sort_index()
)

expected_categories = {
    "bullying": 100,
    "cyberbullying": 100,
    "discrimination": 100,
    "harassment": 100,
    "other": 100,
    "self_harm": 100,
    "threat": 100,
    "violence": 100,
}

actual_counts = (
    df["category"]
    .value_counts()
    .to_dict()
)

print("\nChecking category targets...")

for category, expected in expected_categories.items():

    actual = actual_counts.get(category, 0)

    if actual != expected:
        raise ValueError(
            f"{category} has {actual} examples. "
            f"Expected {expected}."
        )

print("\nAll categories have exactly 100 examples.")

df.to_csv(
    TRAIN_PATH,
    index=False,
)

print("\nTraining dataset saved to:")
print(TRAIN_PATH)

print("\nDone!")