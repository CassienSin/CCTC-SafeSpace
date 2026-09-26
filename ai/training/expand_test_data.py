from pathlib import Path

import pandas as pd


BASE_DIR = Path(__file__).resolve().parent.parent

TRAIN_PATH = BASE_DIR / "dataset" / "train.csv"
TEST_PATH = BASE_DIR / "dataset" / "test.csv"


NEW_TEST_EXAMPLES = {
    "bullying": [
        "Several students make fun of me every morning before class.",
        "A classmate constantly mocks the way I speak.",
        "Students keep calling me insulting names during lunch.",
        "Someone repeatedly makes jokes about my appearance.",
        "A group of students laughs at me whenever I answer in class.",
        "My classmates keep teasing me even after I ask them to stop.",
        "A student regularly humiliates me in front of other students.",
        "Some students intentionally leave me out and make fun of me.",
        "A classmate keeps making cruel jokes about me.",
        "Students repeatedly target me with insults during school activities.",
        "Someone keeps making fun of my clothes every day.",
        "A student laughs at me whenever I walk past their group.",
        "My classmates repeatedly embarrass me in front of others.",
        "A group keeps teasing me about my physical appearance.",
        "A student has been making fun of me for several weeks.",
        "Students keep ridiculing me during breaks.",
    ],

    "cyberbullying": [
        "Someone keeps posting insulting comments about me online.",
        "A student created a group chat to make fun of me.",
        "People are sharing embarrassing messages about me online.",
        "A classmate keeps sending me abusive messages through social media.",
        "Someone posted a humiliating picture of me without permission.",
        "Students are using a group chat to insult me repeatedly.",
        "A person keeps tagging me in offensive posts.",
        "A classmate keeps posting false and embarrassing claims about me online.",
        "A student sends me threatening and insulting messages online.",
        "People keep making jokes about me in an online class group.",
        "Someone created a fake account to embarrass me.",
        "A classmate repeatedly posts negative things about me online.",
        "Students are sharing edited pictures of me to mock me.",
        "Someone keeps commenting hurtful things on my posts.",
        "A student is spreading embarrassing information about me online.",
        "I keep receiving hateful messages from classmates online.",
    ],

    "discrimination": [
        "My classmates treat me differently because of my background.",
        "I was excluded from an activity because of my gender.",
        "Students make negative comments about my nationality.",
        "Someone refuses to work with me because of my disability.",
        "I am being treated unfairly because of my religion.",
        "A student makes offensive remarks about my culture.",
        "My classmates exclude me because of where I come from.",
        "I was treated differently because of my race.",
        "Someone made insulting comments about my religious beliefs.",
        "A group refuses to include me because of my disability.",
        "A student makes jokes about my cultural background.",
        "I feel excluded because of my gender.",
        "Students make offensive comments about my nationality.",
        "The school excluded me from an activity because of my disability.",
        "A classmate treats me unfairly because of my religion.",
        "Someone keeps making discriminatory comments about my background.",
    ],

    "harassment": [
        "A student repeatedly makes unwanted comments toward me.",
        "Someone keeps bothering me even after I ask them to stop.",
        "A classmate repeatedly makes inappropriate remarks toward me.",
        "A student keeps following me around school and bothering me.",
        "A classmate keeps sending me unwanted messages through an online platform.",
        "A classmate keeps making uncomfortable comments about me.",
        "A student continues to disturb me despite being told to stop.",
        "Someone repeatedly approaches me and makes unwanted remarks.",
        "A classmate keeps bothering me during school activities.",
        "A student repeatedly makes inappropriate jokes directed at me.",
        "Someone keeps contacting me even though I asked them not to.",
        "A classmate repeatedly makes comments that make me uncomfortable.",
        "A student continues bothering me in the hallway every day.",
        "Someone repeatedly interferes with me during class.",
        "A student keeps making unwanted personal comments.",
        "A classmate repeatedly follows me and tries to get my attention.",
    ],

    "other": [
        "I need help replacing my lost student identification card.",
        "I want to report a problem with a classroom.",
        "I lost some school materials and need assistance.",
        "I need help resolving a problem with my class schedule.",
        "I would like assistance with a general school concern.",
        "My school supplies were misplaced and I need help finding them.",
        "I would like assistance understanding one of the services available to students.",
        "I want to ask about an issue with my student records.",
        "I need assistance with a problem that does not fit another category.",
        "I would like help understanding a school procedure.",
        "I have a general concern about something that happened on campus.",
        "I need help locating something I lost at school.",
        "I want assistance with an administrative school issue.",
        "I need help with a non-emergency school concern.",
        "I would like to report a problem with school equipment.",
        "I need assistance with a general student service request.",
    ],

    "self_harm": [
        "I have been thinking about hurting myself and need help.",
        "I sometimes think about harming myself when I feel overwhelmed.",
        "I am struggling with thoughts of self-injury.",
        "I have thoughts about hurting myself and do not know what to do.",
        "I feel like I might hurt myself when things become too difficult.",
        "I have been having thoughts about ending my life.",
        "I am afraid that I may harm myself.",
        "I keep thinking about self-harm and want someone to talk to.",
        "I have been struggling with urges to hurt myself.",
        "I feel overwhelmed and have thoughts of injuring myself.",
        "I am experiencing thoughts about harming myself.",
        "I need support because I have been thinking about suicide.",
        "I sometimes feel like hurting myself when I am upset.",
        "I am worried that I might act on thoughts of self-harm.",
        "I have been thinking about hurting myself for several days.",
        "I need someone to help me with thoughts of self-injury.",
    ],

    "threat": [
        "A student told me they are going to hurt me.",
        "A student warned me that they planned to physically harm me later.",
        "A classmate said they would seriously harm me.",
        "Someone sent me a message threatening violence.",
        "A student threatened me if I reported what happened.",
        "A student warned me that they would seriously injure someone close to me.",
        "A classmate made a direct threat against me.",
        "Someone threatened me during an argument.",
        "A student said they would attack me tomorrow.",
        "I received a threatening message from another student.",
        "Someone told me I would be harmed if I went to school.",
        "A classmate threatened me in front of other students.",
        "A student threatened to physically hurt me.",
        "Someone warned me that they planned to attack me.",
        "I was threatened after refusing to do something.",
        "A student made a serious threat against another student.",
    ],

    "violence": [
        "A student physically struck me during a disagreement.",
        "A student assaulted me near the school library.",
        "A classmate pushed me and I was injured.",
        "A student hit another student during a fight.",
        "Someone kicked me during an argument at school.",
        "A classmate physically assaulted me after class.",
        "Two students got into a physical fight.",
        "A student shoved me into a wall.",
        "Someone hit me during a disagreement.",
        "A student attacked another student in the hallway.",
        "I was physically assaulted by a classmate.",
        "A student punched another student during lunch.",
        "Someone pushed and kicked me near the school gate.",
        "A physical fight happened between several students.",
        "A classmate grabbed and struck me during an argument.",
        "Someone physically attacked me during a school activity.",
    ],
}


print("Loading datasets...")

train_df = pd.read_csv(TRAIN_PATH)
test_df = pd.read_csv(TEST_PATH)

print(f"Training examples: {len(train_df)}")
print(f"Existing test examples: {len(test_df)}")


# ---------------------------------------------------------
# Build sets of existing text
# ---------------------------------------------------------

train_texts = set(
    train_df["text"]
    .astype(str)
    .str.strip()
    .str.lower()
)

test_texts = set(
    test_df["text"]
    .astype(str)
    .str.strip()
    .str.lower()
)


# ---------------------------------------------------------
# Validate categories
# ---------------------------------------------------------

expected_categories = {
    "bullying",
    "cyberbullying",
    "discrimination",
    "harassment",
    "other",
    "self_harm",
    "threat",
    "violence",
}

if set(NEW_TEST_EXAMPLES.keys()) != expected_categories:
    raise ValueError(
        "NEW_TEST_EXAMPLES does not contain exactly "
        "the expected categories."
    )


# ---------------------------------------------------------
# Add new test examples
# ---------------------------------------------------------

rows_to_add = []

for category, examples in NEW_TEST_EXAMPLES.items():

    added = 0

    for text in examples:

        normalized = text.strip().lower()

        if normalized in train_texts:
            raise ValueError(
                f"Test example also exists in training data:\n"
                f"{text}"
            )

        if normalized in test_texts:
            print(
                f"Skipping duplicate test example: "
                f"{text}"
            )
            continue

        rows_to_add.append(
            {
                "text": text,
                "category": category,
            }
        )

        test_texts.add(normalized)
        added += 1

    print(
        f"{category}: added {added} new test examples"
    )


# ---------------------------------------------------------
# Add to test dataset
# ---------------------------------------------------------

new_df = pd.DataFrame(rows_to_add)

test_df = pd.concat(
    [test_df, new_df],
    ignore_index=True,
)


# ---------------------------------------------------------
# Validate final dataset
# ---------------------------------------------------------

print("\n" + "=" * 60)
print("TEST DATA EXPANSION")
print("=" * 60)

print(f"\nNew examples added: {len(new_df)}")
print(f"Final test examples: {len(test_df)}")

print("\nFinal test category distribution:")

print(
    test_df["category"]
    .value_counts()
    .sort_index()
)


expected_counts = {
    category: 20
    for category in expected_categories
}

actual_counts = (
    test_df["category"]
    .value_counts()
    .to_dict()
)

print("\nChecking category targets...")

for category, expected in expected_counts.items():

    actual = actual_counts.get(category, 0)

    if actual != expected:
        raise ValueError(
            f"{category} has {actual} test examples. "
            f"Expected {expected}."
        )


# ---------------------------------------------------------
# Final overlap check
# ---------------------------------------------------------

final_test_texts = set(
    test_df["text"]
    .astype(str)
    .str.strip()
    .str.lower()
)

overlap = train_texts.intersection(
    final_test_texts
)

if overlap:
    print("\nOVERLAP DETECTED!")

    for text in sorted(overlap):
        print(text)

    raise ValueError(
        f"{len(overlap)} test examples also exist "
        f"in the training dataset."
    )


print("\nNo training/test text overlap detected.")

# ---------------------------------------------------------
# Save
# ---------------------------------------------------------

test_df.to_csv(
    TEST_PATH,
    index=False,
)

print("\nTest dataset saved to:")
print(TEST_PATH)

print("\n" + "=" * 60)
print("TEST DATASET COMPLETE")
print("=" * 60)

print("\nTraining dataset:")
print(f"  {len(train_df)} examples")

print("Testing dataset:")
print(f"  {len(test_df)} examples")

print("\nDone!")