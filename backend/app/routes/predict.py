from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
import pandas as pd
import io
import uuid
from typing import List, Dict, Any
from backend.app.db.database import get_db
from backend.app.db.models import PredictionRecord
from backend.app.schemas.wine import WineInput, PredictionResponse
from backend.app.ml.model import model_manager
import logging

logger = logging.getLogger("vino_intelligence")

router = APIRouter(prefix="/predict", tags=["Prediction"])

def normalize_column_name(col: str) -> str:
    """Helper to map underscore/snake_case to exact training dataset names"""
    col = col.lower().strip()
    mapping = {
        'fixed_acidity': 'fixed acidity',
        'fixed acidity': 'fixed acidity',
        'volatile_acidity': 'volatile acidity',
        'volatile acidity': 'volatile acidity',
        'citric_acid': 'citric acid',
        'citric acid': 'citric acid',
        'residual_sugar': 'residual sugar',
        'residual sugar': 'residual sugar',
        'chlorides': 'chlorides',
        'free_sulfur_dioxide': 'free sulfur dioxide',
        'free sulfur dioxide': 'free sulfur dioxide',
        'free_so2': 'free sulfur dioxide',
        'total_sulfur_dioxide': 'total sulfur dioxide',
        'total sulfur dioxide': 'total sulfur dioxide',
        'total_so2': 'total sulfur dioxide',
        'density': 'density',
        'ph': 'pH',
        'sulphates': 'sulphates',
        'alcohol': 'alcohol'
    }
    return mapping.get(col, col)

@router.post("/single", response_model=PredictionResponse)
def predict_single(data: WineInput, db: Session = Depends(get_db)):
    """Run single sample chemical analysis inference and log it in the database"""
    try:
        # Perform inference
        prediction, confidence = model_manager.predict(data.dict())
        
        # Calculate standard labels
        is_good = bool(prediction) if model_manager.binary_mode else prediction >= model_manager.quality_threshold
        quality_label = "Good Quality" if is_good else "Below Standard"
        if not model_manager.binary_mode:
            quality_label = f"Score: {prediction}"
            
        # Log to DB
        db_record = PredictionRecord(
            fixed_acidity=data.fixed_acidity,
            volatile_acidity=data.volatile_acidity,
            citric_acid=data.citric_acid,
            residual_sugar=data.residual_sugar,
            chlorides=data.chlorides,
            free_sulfur_dioxide=data.free_sulfur_dioxide,
            total_sulfur_dioxide=data.total_sulfur_dioxide,
            density=data.density,
            ph=data.ph,
            sulphates=data.sulphates,
            alcohol=data.alcohol,
            predicted_quality=prediction,
            prediction_confidence=confidence
        )
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
        
        return PredictionResponse(
            success=True,
            prediction=prediction,
            confidence=confidence,
            is_good=is_good,
            quality_label=quality_label
        )
    except Exception as e:
        db.rollback()
        logger.exception("Single prediction route failure")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )

@router.post("/batch")
async def predict_batch(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload CSV, map column schemas, perform bulk inference, log results, and return predictions"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a CSV file."
        )
        
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        if df.empty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded CSV file is empty."
            )
            
        # Normalize and map headers
        original_cols = df.columns.tolist()
        df.columns = [normalize_column_name(c) for c in df.columns]
        
        required_cols = [
            'fixed acidity', 'volatile acidity', 'citric acid', 'residual sugar',
            'chlorides', 'free sulfur dioxide', 'total sulfur dioxide', 'density',
            'pH', 'sulphates', 'alcohol'
        ]
        
        missing_cols = [c for c in required_cols if c not in df.columns]
        if missing_cols:
            # Let the user know the original columns they uploaded and what is missing
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"CSV must contain chemical columns. Missing: {missing_cols}. Provided headers: {original_cols}"
            )
            
        # Run bulk prediction
        predictions, confidences = model_manager.predict_bulk(df)
        
        batch_id = str(uuid.uuid4())[:8]
        results = []
        db_records = []
        
        # Prepare response & db records in bulk
        for idx, row in df.iterrows():
            pred = int(predictions[idx])
            conf = float(confidences[idx])
            is_good = bool(pred) if model_manager.binary_mode else pred >= model_manager.quality_threshold
            quality_label = "Good Quality" if is_good else "Below Standard"
            if not model_manager.binary_mode:
                quality_label = f"Score: {pred}"
            
            # Form output object
            result_item = {
                "row_index": idx + 1,
                "fixed_acidity": float(row['fixed acidity']),
                "volatile_acidity": float(row['volatile acidity']),
                "citric_acid": float(row['citric acid']),
                "residual_sugar": float(row['residual sugar']),
                "chlorides": float(row['chlorides']),
                "free_sulfur_dioxide": float(row['free sulfur dioxide']),
                "total_sulfur_dioxide": float(row['total sulfur dioxide']),
                "density": float(row['density']),
                "ph": float(row['pH']),
                "sulphates": float(row['sulphates']),
                "alcohol": float(row['alcohol']),
                "prediction": pred,
                "confidence": conf,
                "is_good": is_good,
                "quality_label": quality_label
            }
            results.append(result_item)
            
            # DB entry
            db_records.append(PredictionRecord(
                batch_id=batch_id,
                fixed_acidity=result_item['fixed_acidity'],
                volatile_acidity=result_item['volatile_acidity'],
                citric_acid=result_item['citric_acid'],
                residual_sugar=result_item['residual_sugar'],
                chlorides=result_item['chlorides'],
                free_sulfur_dioxide=result_item['free_sulfur_dioxide'],
                total_sulfur_dioxide=result_item['total_sulfur_dioxide'],
                density=result_item['density'],
                ph=result_item['ph'],
                sulphates=result_item['sulphates'],
                alcohol=result_item['alcohol'],
                predicted_quality=pred,
                prediction_confidence=conf
            ))
            
        # Bulk insert for speed and scalability
        db.add_all(db_records)
        db.commit()
        
        return {
            "success": True,
            "batch_id": batch_id,
            "total_records": len(results),
            "predictions": results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.exception("Batch prediction route failure")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process batch CSV file: {str(e)}"
        )
