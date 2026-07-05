from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging

logger = logging.getLogger("vino_intelligence")

class VinoException(Exception):
    """Base application exception"""
    def __init__(self, message: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class ModelNotLoadedException(VinoException):
    def __init__(self, detail: str = "ML Model or Preprocessing artifacts could not be loaded"):
        super().__init__(detail, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)

class TrainingFailedException(VinoException):
    def __init__(self, detail: str = "Model retraining job failed"):
        super().__init__(detail, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

class InvalidDataException(VinoException):
    def __init__(self, detail: str = "Invalid chemical composition properties provided"):
        super().__init__(detail, status_code=status.HTTP_420_METHOD_FAILURE) # Or HTTP_422_UNPROCESSABLE_ENTITY

def register_exception_handlers(app):
    @app.exception_handler(VinoException)
    async def vino_exception_handler(request: Request, exc: VinoException):
        logger.error(f"VinoException: {exc.message} on path {request.url.path}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"success": False, "error": exc.message}
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        errors = []
        for error in exc.errors():
            loc = " -> ".join(str(x) for x in error.get("loc", []))
            msg = error.get("msg", "Validation error")
            errors.append(f"{loc}: {msg}")
        
        detail_msg = "; ".join(errors)
        logger.warning(f"Validation failed on {request.url.path}: {detail_msg}")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"success": False, "error": "Request validation failed", "details": errors}
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.exception(f"Unhandled exception occurred on path {request.url.path}: {str(exc)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "error": "An unexpected server error occurred."}
        )
