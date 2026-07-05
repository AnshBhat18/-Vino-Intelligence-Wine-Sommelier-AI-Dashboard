from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime
from datetime import datetime
from backend.app.db.database import Base

class PredictionRecord(Base):
    __tablename__ = "prediction_records"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    batch_id = Column(String, nullable=True, index=True)  # Links batch predictions
    
    # Input parameters
    fixed_acidity = Column(Float, nullable=False)
    volatile_acidity = Column(Float, nullable=False)
    citric_acid = Column(Float, nullable=False)
    residual_sugar = Column(Float, nullable=False)
    chlorides = Column(Float, nullable=False)
    free_sulfur_dioxide = Column(Float, nullable=False)
    total_sulfur_dioxide = Column(Float, nullable=False)
    density = Column(Float, nullable=False)
    ph = Column(Float, nullable=False)
    sulphates = Column(Float, nullable=False)
    alcohol = Column(Float, nullable=False)
    
    # Model predictions
    predicted_quality = Column(Integer, nullable=False)
    prediction_confidence = Column(Float, nullable=True)
    
    # Feedback & corrections
    actual_quality = Column(Integer, nullable=True)
    feedback_correct = Column(Boolean, nullable=True)
    feedback_comments = Column(String, nullable=True)
