
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.inference import get_inference_engine


app = FastAPI(
    title="RupAI Model 1 API",
    description="Macroeconomic scenario prediction API",
    version="1.0.0"
)

# Allow requests from the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


class ScenarioRequest(BaseModel):
    target: str
    shock_pct: float = Field(ge=-100, le=100)
    horizon: int = Field(default=1, ge=1, le=12)


@app.get("/")
def home():
    return {
        "message": "RupAI Model 1 API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.get("/models")
def models():
    try:
        engine = get_inference_engine()

        return {
            "available_models": engine.available_models()
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


@app.post("/predict")
def predict(request: ScenarioRequest):
    try:
        engine = get_inference_engine()

        result = engine.predict(
            target=request.target,
            shock_pct=request.shock_pct,
            horizon=request.horizon
        )

        return result

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )
