import pytest
from fastapi.testclient import TestClient
import os
import sys

# Ensure backend folder is in path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_predict_single_validation():
    # Sending invalid data (missing attributes or values out of bounds)
    invalid_payload = {
        "fixed_acidity": 7.4,
        "volatile_acidity": -0.5, # Out of range (must be >= 0.05)
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
    response = client.post("/api/predict/single", json=invalid_payload)
    assert response.status_code == 422
    assert "error" in response.json()

def test_predict_single_success():
    # Sending valid payload
    valid_payload = {
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
    response = client.post("/api/predict/single", json=valid_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "prediction" in data
    assert "confidence" in data
    assert "is_good" in data

def test_get_model_info():
    response = client.get("/api/model/info")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "metadata" in data
    assert "feature_importances" in data
