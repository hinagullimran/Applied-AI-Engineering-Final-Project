from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import products, analysis, websockets
from app.middleware.safety import SafetyMiddleware

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="E-Commerce Intelligence Engine API",
    version="1.0.0",
)

# Set up CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SafetyMiddleware)

# Include routers
app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["Analysis"])
from app.api.routes import market_data
app.include_router(market_data.router, prefix="/api/v1/market-data", tags=["Market Data"])
app.include_router(websockets.router, tags=["WebSockets"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Catalyst API"}
