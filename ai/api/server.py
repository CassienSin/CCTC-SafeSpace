from pathlib import Path
import json
import math
import re

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


BASE_DIR = Path(__file__).resolve().parent.parent

CATEGORY_MODEL_PATH = BASE_DIR / "model" / "incident_model.json"
SEVERITY_MODEL_PATH = BASE_DIR / "model" / "severity_model.json"


if not CATEGORY_MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Category model not found at: {CATEGORY_MODEL_PATH}"
    )

if not SEVERITY_MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Severity model not found at: {SEVERITY_MODEL_PATH}"
    )


def load_model(path):
    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)


category_model = load_model(CATEGORY_MODEL_PATH)
severity_model = load_model(SEVERITY_MODEL_PATH)


app = FastAPI(
    title="CCTC SafeSpace AI",
    description=(
        "AI incident classification and "
        "severity assessment API for "
        "CCTC SafeSpace"
    ),
    version="2.1.0",
)


class ReportRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=5,
        max_length=10000,
        description="Student incident report text",
    )


TOKEN_PATTERN = re.compile(r"(?u)\b\w\w+\b")


def tokenize(text):
    return TOKEN_PATTERN.findall(text.lower())


def generate_ngrams(tokens):
    ngrams = []

    for token in tokens:
        ngrams.append(token)

    for index in range(len(tokens) - 1):
        ngrams.append(
            f"{tokens[index]} {tokens[index + 1]}"
        )

    return ngrams


def transform_text(model, text):
    tokens = tokenize(text)
    ngrams = generate_ngrams(tokens)

    vocabulary = model["vocabulary"]
    idf = model["idf"]

    counts = {}

    for term in ngrams:
        index = vocabulary.get(term)

        if index is not None:
            counts[index] = counts.get(index, 0) + 1

    if not counts:
        return {}

    if model.get("sublinear_tf"):
        for index in counts:
            counts[index] = 1.0 + math.log(
                counts[index]
            )

    total_squared = 0.0

    for index, value in counts.items():
        weighted = value * idf[index]
        counts[index] = weighted
        total_squared += weighted * weighted

    norm = math.sqrt(total_squared)

    if norm > 0:
        for index in counts:
            counts[index] /= norm

    return counts


def softmax(scores):
    maximum = max(scores)

    exponentials = [
        math.exp(score - maximum)
        for score in scores
    ]

    total = sum(exponentials)

    return [
        value / total
        for value in exponentials
    ]


def predict(model, text, limit=3):
    vector = transform_text(model, text)

    coefficients = model["coef"]
    intercepts = model["intercept"]
    classes = model["classes"]

    scores = []

    for class_index in range(len(classes)):
        score = intercepts[class_index]

        for feature_index, value in vector.items():
            score += (
                coefficients[class_index][feature_index]
                * value
            )

        scores.append(score)

    probabilities = softmax(scores)

    ranked = sorted(
        zip(classes, probabilities),
        key=lambda item: item[1],
        reverse=True,
    )

    prediction = ranked[0][0]
    predicted_probability = ranked[0][1]

    top_predictions = [
        {
            "category": category,
            "probability": round(
                float(probability),
                4,
            ),
        }
        for category, probability in ranked[:limit]
    ]

    return (
        prediction,
        predicted_probability,
        top_predictions,
    )


@app.get("/")
def root():
    return {
        "service": "CCTC SafeSpace AI",
        "status": "online",
        "models": {
            "category": "TF-IDF + Logistic Regression",
            "severity": "TF-IDF + Logistic Regression",
            "runtime": "lightweight Python inference",
        },
    }


@app.post("/predict")
def predict_report(
    request: ReportRequest,
):
    text = request.text.strip()

    if not text:
        raise HTTPException(
            status_code=400,
            detail="Report text cannot be empty.",
        )

    (
        prediction,
        predicted_probability,
        top_predictions,
    ) = predict(
        category_model,
        text,
    )

    high_risk_categories = {
        "self_harm",
        "threat",
        "violence",
    }

    requires_human_review = (
        prediction in high_risk_categories
    )

    return {
        "category": prediction,
        "probability": round(
            predicted_probability,
            4,
        ),
        "top_predictions": top_predictions,
        "requires_human_review":
            requires_human_review,
    }


@app.post("/predict-severity")
def predict_severity(
    request: ReportRequest,
):
    text = request.text.strip()

    if not text:
        raise HTTPException(
            status_code=400,
            detail="Report text cannot be empty.",
        )

    (
        prediction,
        predicted_probability,
        top_predictions,
    ) = predict(
        severity_model,
        text,
    )

    requires_human_review = (
        prediction in {
            "high",
            "critical",
        }
    )

    return {
        "severity": prediction,
        "probability": round(
            predicted_probability,
            4,
        ),
        "top_predictions": [
            {
                "severity": item["category"],
                "probability":
                    item["probability"],
            }
            for item in top_predictions
        ],
        "requires_human_review":
            requires_human_review,
    }


@app.post("/predict-all")
def predict_all(
    request: ReportRequest,
):
    text = request.text.strip()

    if not text:
        raise HTTPException(
            status_code=400,
            detail="Report text cannot be empty.",
        )

    (
        category_prediction,
        category_probability,
        category_top_predictions,
    ) = predict(
        category_model,
        text,
    )

    (
        severity_prediction,
        severity_probability,
        severity_top_predictions,
    ) = predict(
        severity_model,
        text,
    )

    high_risk_categories = {
        "self_harm",
        "threat",
        "violence",
    }

    high_risk_severities = {
        "high",
        "critical",
    }

    requires_human_review = (
        category_prediction in high_risk_categories
        or severity_prediction in high_risk_severities
    )

    return {
        "category": category_prediction,
        "category_probability": round(
            category_probability,
            4,
        ),
        "category_top_predictions":
            category_top_predictions,

        "severity": severity_prediction,
        "severity_probability": round(
            severity_probability,
            4,
        ),
        "severity_top_predictions": [
            {
                "severity": item["category"],
                "probability":
                    item["probability"],
            }
            for item in severity_top_predictions
        ],

        "requires_human_review":
            requires_human_review,
    }