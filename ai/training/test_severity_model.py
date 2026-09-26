from pathlib import Path

import joblib


BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "model" / "severity_classifier.joblib"

model = joblib.load(MODEL_PATH)


test_reports = [
    {
        "name": "Low-level classroom concern",
        "text": (
            "A classmate made fun of my presentation in front "
            "of everyone. It embarrassed me but they stopped afterward."
        ),
    },
    {
        "name": "Repeated bullying",
        "text": (
            "Several students have been making fun of me every "
            "day for the past two weeks and intentionally excluding me."
        ),
    },
    {
        "name": "Physical threat",
        "text": (
            "A student threatened to beat me after school if "
            "I reported what happened to the teacher."
        ),
    },
    {
        "name": "Immediate violent danger",
        "text": (
            "A student is attacking another student right now "
            "and the student is seriously injured."
        ),
    },
    {
        "name": "Online harassment",
        "text": (
            "Someone keeps sending me insulting messages online "
            "and posting embarrassing comments about me."
        ),
    },
    {
        "name": "Serious threat",
        "text": (
            "A student told me they are going to seriously hurt "
            "me tomorrow after class."
        ),
    },
    {
        "name": "Minor exclusion",
        "text": (
            "My classmates left me out of a group activity today."
        ),
    },
    {
        "name": "Active weapon threat",
        "text": (
            "Someone has a weapon and is currently threatening "
            "students inside the school."
        ),
    },
]


print("=" * 70)
print("CCTC SAFESPACE SEVERITY MODEL TEST")
print("=" * 70)


for index, report in enumerate(test_reports, start=1):

    text = report["text"]

    prediction = model.predict([text])[0]

    probabilities = model.predict_proba([text])[0]

    classes = model.classes_

    ranked_predictions = sorted(
        zip(classes, probabilities),
        key=lambda item: item[1],
        reverse=True,
    )

    print("\n" + "-" * 70)

    print(f"Test {index}: {report['name']}")

    print(f"\nReport:")
    print(text)

    print(f"\nPredicted severity:")
    print(prediction.upper())

    print("\nModel probabilities:")

    for category, probability in ranked_predictions:
        print(
            f"  {category:<10} "
            f"{probability:.2%}"
        )


print("\n" + "=" * 70)
print("TEST COMPLETE")
print("=" * 70)