from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.db.database import get_db
from backend.app.db.models import PredictionRecord
from backend.app.schemas.wine import PredictionRecordSchema, FeedbackRequest
import logging

logger = logging.getLogger("vino_intelligence")

router = APIRouter(prefix="/history", tags=["Inference History & Feedback"])

@router.get("", response_model=List[PredictionRecordSchema])
def get_prediction_history(
    skip: int = 0,
    limit: int = 100,
    batch_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve logged predictions, paginated, and optionally filtered by batch_id"""
    query = db.query(PredictionRecord)
    if batch_id:
        query = query.filter(PredictionRecord.batch_id == batch_id)
        
    records = query.order_by(PredictionRecord.timestamp.desc()).offset(skip).limit(limit).all()
    return records

@router.post("/{record_id}/feedback")
def submit_feedback(
    record_id: int,
    feedback: FeedbackRequest,
    db: Session = Depends(get_db)
):
    """Log actual sommelier taste results and correct predicted quality ratings"""
    db_record = db.query(PredictionRecord).filter(PredictionRecord.id == record_id).first()
    if not db_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction record with ID {record_id} not found."
        )
        
    db_record.actual_quality = feedback.actual_quality
    db_record.feedback_correct = feedback.feedback_correct
    db_record.feedback_comments = feedback.feedback_comments
    
    try:
        db.commit()
        logger.info(f"Feedback logged successfully for record {record_id}.")
        return {"success": True, "message": "Feedback submitted successfully."}
    except Exception as e:
        db.rollback()
        logger.exception(f"Feedback submission database error for ID {record_id}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record user feedback logs."
        )

@router.delete("/clear")
def clear_history(db: Session = Depends(get_db)):
    """Clear all historical prediction records in the SQLite logs"""
    try:
        db.query(PredictionRecord).delete()
        db.commit()
        return {"success": True, "message": "Prediction history cleared successfully."}
    except Exception as e:
        db.rollback()
        logger.exception("Failed to clear prediction history logs")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear prediction logs."
        )
