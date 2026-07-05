from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import logging

from backend.app.core.config import settings
from backend.app.core.logging_config import setup_logging
from backend.app.core.exceptions import register_exception_handlers
from backend.app.db.database import engine, Base
from backend.app.routes import predict, model, history
from backend.app.ml.model import model_manager

# Initialize Logging
logger = setup_logging()

# Auto-migrate database tables
try:
    logger.info("Performing database migrations...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
except Exception as e:
    logger.exception("Database migration failed")

# Initialize FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="A professional ML API for Wine Quality prediction, feature importance analysis, and retraining.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Register exceptions
register_exception_handlers(app)

# Configure CORS - allows any port on localhost or 127.0.0.1 dynamically
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static Files Mount for ML artifacts (serving confusion matrix and feature plots)
if os.path.exists(settings.MODEL_DIR):
    logger.info(f"Mounting static files from {settings.MODEL_DIR}")
    app.mount("/static/model", StaticFiles(directory=settings.MODEL_DIR), name="model_static")

# Include Routers
app.include_router(predict.router, prefix=settings.API_V1_STR)
app.include_router(model.router, prefix=settings.API_V1_STR)
app.include_router(history.router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def startup_event():
    logger.info("Vino Intelligence API starting up...")
    # Trigger model manager loading so model is cached in RAM
    if not model_manager.is_loaded:
        logger.warning("ML Model not loaded on startup. Eager load initiated.")
        model_manager.load_model()
    else:
        logger.info("ML Model pre-cached successfully.")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "model_loaded": model_manager.is_loaded,
        "docs": "/docs"
    }
