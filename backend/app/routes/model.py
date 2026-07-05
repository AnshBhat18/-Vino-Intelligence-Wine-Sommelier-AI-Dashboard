from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List
import pandas as pd
import os
import logging
from backend.app.ml.model import model_manager
from backend.app.ml.trainer import train_model
from backend.app.schemas.wine import ModelRetrainRequest
from backend.app.core.config import settings

logger = logging.getLogger("vino_intelligence")

router = APIRouter(prefix="/model", tags=["Model Dashboard"])

@router.get("/info")
def get_model_info():
    """Retrieve active model accuracies, metrics, parameters, and dynamic feature importances"""
    if not model_manager.is_loaded:
        model_manager.load_model()
        if not model_manager.is_loaded:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Model artifacts are not loaded on server."
            )
            
    # Read feature importance CSV if exists
    importance_list = []
    fi_path = os.path.join(settings.MODEL_DIR, "feature_importance.csv")
    if os.path.exists(fi_path):
        try:
            df_fi = pd.read_csv(fi_path)
            importance_list = df_fi.to_dict(orient="records")
        except Exception as e:
            logger.warning(f"Failed to read feature importances: {e}")
            
    return {
        "success": True,
        "metadata": model_manager.metadata,
        "binary_mode": model_manager.binary_mode,
        "quality_threshold": model_manager.quality_threshold,
        "feature_importances": importance_list
    }

@router.post("/retrain")
def trigger_retraining(params: ModelRetrainRequest):
    """Trigger programmatic retraining of the wine quality classifier with new configurations"""
    try:
        logger.info(f"Retraining requested with params: {params.dict()}")
        metadata = train_model(
            n_estimators=params.n_estimators,
            max_depth=params.max_depth,
            min_samples_split=params.min_samples_split,
            min_samples_leaf=params.min_samples_leaf,
            binary_classification=params.binary_classification,
            quality_threshold=params.quality_threshold,
            test_size=params.test_size
        )
        return {
            "success": True,
            "message": "Model retrained successfully",
            "metadata": metadata
        }
    except Exception as e:
        logger.exception("Model retraining route failure")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Retraining failed: {str(e)}"
        )
