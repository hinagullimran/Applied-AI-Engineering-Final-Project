import uuid
import re
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.logging import logger

# Simple PII patterns
PII_PATTERNS = [
    re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'), # Email
    re.compile(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b'), # Phone
]

class SafetyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        correlation_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        request.state.correlation_id = correlation_id
        
        # Log request
        logger.info(f"Incoming request: {request.method} {request.url.path}", extra={"correlation_id": correlation_id})
        
        # Input Sanitization (Conceptual - would normally check request.body for JSON)
        # For simplicity, we'll just check query params for basic injection patterns
        for param, value in request.query_params.items():
            if any(p.search(value) for p in PII_PATTERNS):
                logger.warning(f"PII detected in query param: {param}", extra={"correlation_id": correlation_id})
        
        response = await call_next(request)
        response.headers["X-Correlation-ID"] = correlation_id
        return response
