from pathlib import Path
import joblib

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "model" / "incident_classifier.joblib"

print("Loading trained model...")
model = joblib.load(MODEL_PATH)

test_reports = [
    {
        "name": "Bullying",
        "text": "A classmate keeps making fun of me in front of other students and calls me insulting names almost every day."
    },
    {
        "name": "Cyberbullying",
        "text": "Someone created a group chat where they post embarrassing comments and insulting messages about me."
    },
    {
        "name": "Discrimination",
        "text": "I was excluded from a school activity because of my cultural background."
    },
    {
        "name": "Harassment",
        "text": "A student repeatedly approaches me during breaks even after I have asked them to leave me alone."
    },
    {
        "name": "Other",
        "text": "I have a school safety concern that does not seem to fit any of the listed incident categories."
    },
    {
        "name": "Self-harm",
        "text": "I have been having thoughts about hurting myself and I need help from someone at school."
    },
    {
        "name": "Threat",
        "text": "A student told me they would hurt me after school if I reported what happened."
    },
    {
        "name": "Violence",
        "text": "A student physically attacked me during an argument and hit me several times."
    },
]

print("\n" + "=" * 70)
print("CCTC SAFESPACE AI CLASSIFIER TEST")
print("=" * 70)

for index, report in enumerate(test_reports, start=1):
    text = report["text"]

    prediction = model.predict([text])[0]
    probabilities = model.predict_proba([text])[0]

    classes = model.classes_
    confidence = probabilities.max()

    ranked = sorted(
        zip(classes, probabilities),
        key=lambda item: item[1],
        reverse=True
    )

    print(f"\nTest {index}: {report['name']}")
    print("-" * 70)
    print(f"Report: {text}")
    print(f"Predicted category: {prediction}")
    print(f"Confidence: {confidence:.2%}")

    print("\nTop predictions:")
    for category, probability in ranked[:3]:
        print(f"  {category:<18} {probability:.2%}")

print("\n" + "=" * 70)
print("TEST COMPLETE")
print("=" * 70)