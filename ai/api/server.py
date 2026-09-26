from pathlib import Path

import joblib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


# --------------------------------------------------
# Paths
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

CATEGORY_MODEL_PATH = (
    BASE_DIR
    / "model"
    / "incident_classifier.joblib"
)

SEVERITY_MODEL_PATH = (
    BASE_DIR
    / "model"
    / "severity_classifier.joblib"
)


# --------------------------------------------------
# Load models
# --------------------------------------------------

if not CATEGORY_MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Category model not found at: "
        f"{CATEGORY_MODEL_PATH}"
    )

if not SEVERITY_MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Severity model not found at: "
        f"{SEVERITY_MODEL_PATH}"
    )


category_model = joblib.load(
    CATEGORY_MODEL_PATH
)

severity_model = joblib.load(
    SEVERITY_MODEL_PATH
)


# --------------------------------------------------
# FastAPI
# --------------------------------------------------

app = FastAPI(
    title="CCTC SafeSpace AI",
    description=(
        "AI incident classification and "
        "severity assessment API for "
        "CCTC SafeSpace"
    ),
    version="2.0.0",
)


# --------------------------------------------------
# Request model
# --------------------------------------------------

class ReportRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=5,
        max_length=10000,
        description="Student incident report text",
    )


# --------------------------------------------------
# Helper
# --------------------------------------------------

def get_ranked_predictions(
    model,
    text,
    limit=3,
):
    prediction = model.predict([text])[0]
    probabilities = model.predict_proba([text])[0]
    classes = model.classes_

    ranked_predictions = sorted(
        zip(classes, probabilities),
        key=lambda item: item[1],
        reverse=True,
    )

    top_predictions = [
        {
            "category": category,
            "probability": round(
                float(probability),
                4,
            ),
        }
        for category, probability
        in ranked_predictions[:limit]
    ]

    predicted_probability = float(
        probabilities.max()
    )

    return (
        prediction,
        predicted_probability,
        top_predictions,
    )


# --------------------------------------------------
# Root
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "service": "CCTC SafeSpace AI",
        "status": "online",
        "models": {
            "category":
                "TF-IDF + Logistic Regression",
            "severity":
                "TF-IDF + Logistic Regression",
        },
    }


# --------------------------------------------------
# Category prediction
# --------------------------------------------------

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
    ) = get_ranked_predictions(
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


# --------------------------------------------------
# Severity prediction
# --------------------------------------------------

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
    ) = get_ranked_predictions(
        severity_model,
        text,
    )

    # Critical and high severity reports
    # should receive human review.
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


# --------------------------------------------------
# Combined prediction
# --------------------------------------------------

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

    # ----------------------------------------------
    # Category prediction
    # ----------------------------------------------

    (
        category_prediction,
        category_probability,
        category_top_predictions,
    ) = get_ranked_predictions(
        category_model,
        text,
    )

    # ----------------------------------------------
    # Severity prediction
    # ----------------------------------------------

    (
        severity_prediction,
        severity_probability,
        severity_top_predictions,
    ) = get_ranked_predictions(
        severity_model,
        text,
    )

    # ----------------------------------------------
    # Human review
    # ----------------------------------------------

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

    # ----------------------------------------------
    # Response
    # ----------------------------------------------

    return {
        "category": category_prediction,
        "category_probability": round(
            category_probability,
            4,
        ),
        "category_top_predictions": category_top_predictions,
        
        "severity": severity_prediction,
        "severity_probability": round(
            severity_probability,
            4,
        ),
        "severity_top_predictions": [
            {
                "severity": item["category"],
                "probability": item["probability"],
            }
            for item in severity_top_predictions
        ],
        "requires_human_review":
            requires_human_review,
    }