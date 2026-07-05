from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class WineInput(BaseModel):
    fixed_acidity: float = Field(..., description="Fixed Acidity (g/L)", ge=3.0, le=16.0)
    volatile_acidity: float = Field(..., description="Volatile Acidity (g/L)", ge=0.05, le=2.0)
    citric_acid: float = Field(..., description="Citric Acid (g/L)", ge=0.0, le=1.5)
    residual_sugar: float = Field(..., description="Residual Sugar (g/L)", ge=0.5, le=70.0)
    chlorides: float = Field(..., description="Chlorides (g/L)", ge=0.001, le=0.6)
    free_sulfur_dioxide: float = Field(..., description="Free SO₂ (mg/L)", ge=1.0, le=300.0)
    total_sulfur_dioxide: float = Field(..., description="Total SO₂ (mg/L)", ge=5.0, le=500.0)
    density: float = Field(..., description="Density (g/cm³)", ge=0.980, le=1.050)
    ph: float = Field(..., description="pH", ge=2.5, le=4.5)
    sulphates: float = Field(..., description="Sulphates (g/L)", ge=0.1, le=2.5)
    alcohol: float = Field(..., description="Alcohol (%ABV)", ge=7.0, le=16.0)

    class Config:
        json_schema_extra = {
            "example": {
                "fixed_acidity": 7.4,
                "volatile_acidity": 0.7,
                "citric_acid": 0.0,
                "residual_sugar": 1.9,
                "chlorides": 0.076,
                "free_sulfur_dioxide": 11.0,
                "total_sulfur_dioxide": 34.0,
                "density": 0.9978,
                "ph": 3.51,
                "sulphates": 0.56,
                "alcohol": 9.4
            }
        }

class PredictionResponse(BaseModel):
    success: bool
    prediction: int
    confidence: float
    is_good: bool
    quality_label: str

class FeedbackRequest(BaseModel):
    actual_quality: Optional[int] = Field(None, ge=3, le=9)
    feedback_correct: bool
    feedback_comments: Optional[str] = Field(None, max_length=500)

class PredictionRecordSchema(BaseModel):
    id: int
    timestamp: datetime
    batch_id: Optional[str] = None
    
    # Inputs
    fixed_acidity: float
    volatile_acidity: float
    citric_acid: float
    residual_sugar: float
    chlorides: float
    free_sulfur_dioxide: float
    total_sulfur_dioxide: float
    density: float
    ph: float
    sulphates: float
    alcohol: float
    
    # Model predictions
    predicted_quality: int
    prediction_confidence: Optional[float] = None
    
    # Feedback & corrections
    actual_quality: Optional[int] = None
    feedback_correct: Optional[bool] = None
    feedback_comments: Optional[str] = None

    class Config:
        from_attributes = True

class ModelRetrainRequest(BaseModel):
    n_estimators: int = Field(300, ge=10, le=1000)
    max_depth: int = Field(20, ge=1, le=100)
    min_samples_split: int = Field(2, ge=2, le=20)
    min_samples_leaf: int = Field(1, ge=1, le=20)
    binary_classification: bool = True
    quality_threshold: int = Field(6, ge=4, le=8)
    test_size: float = Field(0.2, ge=0.1, le=0.5)
