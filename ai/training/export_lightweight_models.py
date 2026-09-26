from pathlib import Path
import json
import joblib


BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "model"


def export_model(input_name, output_name):
    model_path = MODEL_DIR / input_name
    output_path = MODEL_DIR / output_name

    pipeline = joblib.load(model_path)

    vectorizer = pipeline.named_steps["tfidf"]
    classifier = pipeline.named_steps["classifier"]

    data = {
        "vocabulary": vectorizer.vocabulary_,
        "idf": vectorizer.idf_.tolist(),
        "ngram_range": list(vectorizer.ngram_range),
        "sublinear_tf": vectorizer.sublinear_tf,
        "lowercase": vectorizer.lowercase,
        "token_pattern": vectorizer.token_pattern,
        "classes": classifier.classes_.tolist(),
        "coef": classifier.coef_.tolist(),
        "intercept": classifier.intercept_.tolist(),
    }

    with open(output_path, "w", encoding="utf-8") as file:
        json.dump(data, file, separators=(",", ":"))

    print(f"Exported: {output_path}")
    print(f"Size: {output_path.stat().st_size / 1024:.2f} KB")


export_model(
    "incident_classifier.joblib",
    "incident_model.json",
)

export_model(
    "severity_classifier.joblib",
    "severity_model.json",
)