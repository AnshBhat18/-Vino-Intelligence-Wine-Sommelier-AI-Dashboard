import os
import joblib
import pandas as pd
import numpy as np
import threading
from typing import Dict, Any, Tuple
from backend.app.core.config import settings
from backend.app.core.exceptions import ModelNotLoadedException
import logging

logger = logging.getLogger("vino_intelligence")

class MLModelManager:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.model = None
        self.scaler = None
        self.metadata = None
        self.binary_mode = True
        self.quality_threshold = 6
        self.feature_names = []
        self._load_lock = threading.Lock()
        self.load_model()
        self._initialized = True

    def load_model(self):
        """Thread-safe loading of model artifacts"""
        with self._load_lock:
            required_files = [
                'best_model.pkl',
                'scaler.pkl',
                'model_metadata.pkl',
                'binary_mode.pkl',
                'quality_threshold.pkl',
                'feature_names.pkl'
            ]
            
            # Check if files exist
            missing = [f for f in required_files if not os.path.exists(os.path.join(settings.MODEL_DIR, f))]
            if missing:
                logger.warning(f"Model files {missing} are missing in {settings.MODEL_DIR}. Attempting training...")
                from backend.app.ml.trainer import train_model
                try:
                    train_model()
                except Exception as e:
                    logger.error(f"Failed to auto-train model: {e}")
                    # We will raise the exception later during prediction if still missing
            
            try:
                self.model = joblib.load(os.path.join(settings.MODEL_DIR, 'best_model.pkl'))
                self.scaler = joblib.load(os.path.join(settings.MODEL_DIR, 'scaler.pkl'))
                self.metadata = joblib.load(os.path.join(settings.MODEL_DIR, 'model_metadata.pkl'))
                self.binary_mode = joblib.load(os.path.join(settings.MODEL_DIR, 'binary_mode.pkl'))
                self.quality_threshold = joblib.load(os.path.join(settings.MODEL_DIR, 'quality_threshold.pkl'))
                self.feature_names = joblib.load(os.path.join(settings.MODEL_DIR, 'feature_names.pkl'))
                logger.info("Successfully loaded all ML model artifacts.")
            except Exception as e:
                logger.exception("Error loading ML model artifacts")
                self.model = None

    @property
    def is_loaded(self) -> bool:
        return self.model is not None and self.scaler is not None

    def create_features(self, df_input: pd.DataFrame) -> pd.DataFrame:
        """Create engineered features - MATCHES train.py EXACTLY"""
        df_new = df_input.copy()

        # Interaction features
        df_new['alcohol_sugar'] = df_new['alcohol'] * df_new['residual sugar']
        df_new['alcohol_acidity'] = df_new['alcohol'] * df_new['fixed acidity']
        df_new['alcohol_volatile'] = df_new['alcohol'] * df_new['volatile acidity']
        df_new['density_alcohol'] = df_new['density'] / (df_new['alcohol'] + 0.001)
        df_new['sulphates_alcohol'] = df_new['sulphates'] * df_new['alcohol']

        # Ratio features
        df_new['free_so2_ratio'] = df_new['free sulfur dioxide'] / (df_new['total sulfur dioxide'] + 1)
        df_new['volatile_fixed_ratio'] = df_new['volatile acidity'] / (df_new['fixed acidity'] + 0.001)
        df_new['citric_fixed_ratio'] = df_new['citric acid'] / (df_new['fixed acidity'] + 0.001)
        df_new['sugar_alcohol_ratio'] = df_new['residual sugar'] / (df_new['alcohol'] + 0.001)
        df_new['chlorides_sulphates_ratio'] = df_new['chlorides'] / (df_new['sulphates'] + 0.001)

        # Polynomial features
        df_new['alcohol_squared'] = df_new['alcohol'] ** 2
        df_new['alcohol_cubed'] = df_new['alcohol'] ** 3
        df_new['sulphates_squared'] = df_new['sulphates'] ** 2
        df_new['volatile_squared'] = df_new['volatile acidity'] ** 2
        df_new['density_squared'] = df_new['density'] ** 2

        # Chemical balance
        df_new['total_acidity'] = df_new['fixed acidity'] + df_new['volatile acidity'] + df_new['citric acid']
        df_new['acidity_to_ph'] = df_new['total_acidity'] * df_new['pH']
        df_new['acidity_balance'] = df_new['fixed acidity'] - df_new['volatile acidity']
        df_new['acid_sugar_balance'] = df_new['total_acidity'] / (df_new['residual sugar'] + 1)

        # Sulfur features
        df_new['bound_so2'] = df_new['total sulfur dioxide'] - df_new['free sulfur dioxide']
        df_new['so2_intensity'] = df_new['total sulfur dioxide'] * df_new['sulphates']

        # Quality flags
        df_new['high_alcohol'] = (df_new['alcohol'] > 11).astype(int)
        df_new['low_volatile'] = (df_new['volatile acidity'] < 0.4).astype(int)
        df_new['optimal_ph'] = ((df_new['pH'] >= 3.0) & (df_new['pH'] <= 3.5)).astype(int)
        df_new['quality_score'] = df_new['high_alcohol'] + df_new['low_volatile'] + df_new['optimal_ph']

        # Log transforms
        df_new['log_residual_sugar'] = np.log1p(df_new['residual sugar'])
        df_new['log_chlorides'] = np.log1p(df_new['chlorides'])
        df_new['log_free_sulfur'] = np.log1p(df_new['free sulfur dioxide'])
        df_new['log_total_sulfur'] = np.log1p(df_new['total sulfur dioxide'])

        return df_new

    def predict(self, raw_features: Dict[str, float]) -> Tuple[int, float]:
        """Perform predictions on raw input mapping chemical values"""
        if not self.is_loaded:
            self.load_model()
            if not self.is_loaded:
                raise ModelNotLoadedException()

        # Map frontend properties to exact training dataframe headers
        input_data = {
            'fixed acidity': [raw_features['fixed_acidity']],
            'volatile acidity': [raw_features['volatile_acidity']],
            'citric acid': [raw_features['citric_acid']],
            'residual sugar': [raw_features['residual_sugar']],
            'chlorides': [raw_features['chlorides']],
            'free sulfur dioxide': [raw_features['free_sulfur_dioxide']],
            'total sulfur dioxide': [raw_features['total_sulfur_dioxide']],
            'density': [raw_features['density']],
            'pH': [raw_features['ph']],
            'sulphates': [raw_features['sulphates']],
            'alcohol': [raw_features['alcohol']],
        }
        
        df_input = pd.DataFrame(input_data)
        df_eng = self.create_features(df_input)
        df_scaled = self.scaler.transform(df_eng)
        
        prediction = int(self.model.predict(df_scaled)[0])
        
        confidence = 1.0
        if hasattr(self.model, "predict_proba"):
            probabilities = self.model.predict_proba(df_scaled)[0]
            confidence = float(np.max(probabilities))
            
        return prediction, confidence

    def predict_bulk(self, raw_records: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """Bulk inference helper for pandas dataframes"""
        if not self.is_loaded:
            self.load_model()
            if not self.is_loaded:
                raise ModelNotLoadedException()

        # Check for required columns
        required_cols = [
            'fixed acidity', 'volatile acidity', 'citric acid', 'residual sugar',
            'chlorides', 'free sulfur dioxide', 'total sulfur dioxide', 'density',
            'pH', 'sulphates', 'alcohol'
        ]
        
        missing_cols = [col for col in required_cols if col not in raw_records.columns]
        if missing_cols:
            raise ValueError(f"CSV file is missing columns: {missing_cols}")

        df_eng = self.create_features(raw_records[required_cols])
        df_scaled = self.scaler.transform(df_eng)
        
        predictions = self.model.predict(df_scaled)
        
        confidences = np.ones(len(predictions))
        if hasattr(self.model, "predict_proba"):
            probabilities = self.model.predict_proba(df_scaled)
            confidences = np.max(probabilities, axis=1)
            
        return predictions, confidences

model_manager = MLModelManager()
