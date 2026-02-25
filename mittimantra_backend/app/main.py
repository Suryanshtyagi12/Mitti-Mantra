# app/main.py
"""
Mittimantra - AI-Driven Agricultural Decision Support System
Main FastAPI Application
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
import logging
import os

from app.models.request_models import CropPredictionRequest, IrrigationRequest
from app.models.response_models import (
    CropPredictionResponse,
    DiseasePredictionResponse,
    HealthResponse,
    IrrigationResponse,
    PestControlResponse
)
from app.services.crop_service import CropRecommendationService
from app.services.disease_service import DiseaseDetectionService
from app.services.irrigation_service import IrrigationService
from app.services.pest_service import PestPredictionService

# Import Auth Router
from app.routes.auth_routes import router as auth_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global service instances
crop_service = None
disease_service = None
irrigation_service = None
pest_service = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    global crop_service, disease_service, irrigation_service, pest_service
    
    logger.info("Loading ML models...")
    try:
        # Initialize services with proper error handling
        try:
            crop_service = CropRecommendationService()
            logger.info("Crop recommendation service loaded")
        except Exception as e:
            logger.warning(f"Crop service not available: {str(e)}")
            crop_service = None
        
        try:
            disease_service = DiseaseDetectionService()
            logger.info("Disease detection service loaded")
        except Exception as e:
            logger.warning(f"Disease service not available: {str(e)}")
            disease_service = None
        
        try:
            irrigation_service = IrrigationService()
            logger.info("Irrigation service loaded")
        except Exception as e:
            logger.warning(f"Irrigation service not available: {str(e)}")
            irrigation_service = None
        
        try:
            pest_service = PestPredictionService()
            logger.info("Pest service loaded")
        except Exception as e:
            logger.warning(f"Pest service not available: {str(e)}")
            pest_service = None
        
        logger.info("Startup complete")
    except Exception as e:
        logger.error(f"Failed during startup: {str(e)}")
    
    yield
    
    logger.info("Shutting down Mittimantra backend")


app = FastAPI(
    title="Mittimantra API",
    description="AI-Driven Agricultural Decision Support System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration - Allow React frontend on localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",  # Vite default port
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Setup Templates
templates = Jinja2Templates(directory="templates")

# Include Auth Routers
from app.routes.auth_routes import router as auth_router
from app.routes.api_auth_routes import router as api_auth_router
from app.routes.ai_routes import router as ai_router

app.include_router(api_auth_router, prefix="/api/auth", tags=["API Authentication"])
app.include_router(auth_router, prefix="/auth", tags=["HTML Authentication"])
app.include_router(ai_router, prefix="/api/ai", tags=["AI Features"])


@app.get("/", include_in_schema=False)
async def root():
    """Redirect root to login page"""
    return RedirectResponse(url="/login")


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    """Serve favicon"""
    if os.path.exists("static/favicon.png"):
        return FileResponse("static/favicon.png")
    return RedirectResponse(url="/static/favicon.ico") # Fallback if png missing


@app.get("/login")
async def login_page(request: Request):
    """Serve the login page"""
    return templates.TemplateResponse("login.html", {"request": request})


@app.get("/register")
async def register_page(request: Request):
    """Serve the registration page"""
    return templates.TemplateResponse("register.html", {"request": request})


from app.auth import decode_access_token
from app.database import get_db
from app.db_models import User
from sqlalchemy.orm import Session
from fastapi import Depends

@app.get("/dashboard")
async def dashboard_page(request: Request, db: Session = Depends(get_db)):
    """Serve the dashboard page (Protected)"""
    token = request.cookies.get("access_token")
    if not token:
        return RedirectResponse(url="/login")
    
    # Verify token
    payload = decode_access_token(token)
    if not payload:
        return RedirectResponse(url="/login")
        
    username = payload.get("sub")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return RedirectResponse(url="/login")

    return templates.TemplateResponse("dashboard.html", {"request": request, "user": user})


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="Mittimantra backend running",
        models_loaded=True
    )


@app.post("/predict-crop", response_model=CropPredictionResponse)
async def predict_crop(request: CropPredictionRequest):
    """
    Data-Driven Crop Pattern Recommendation
    
    Recommends optimal crop based on soil and environmental conditions
    """
    if crop_service is None:
        raise HTTPException(
            status_code=503,
            detail="Crop recommendation service is not available. Model not loaded."
        )
    
    try:
        result = crop_service.predict_crop(
            nitrogen=request.nitrogen,
            phosphorus=request.phosphorus,
            potassium=request.potassium,
            temperature=request.temperature,
            humidity=request.humidity,
            ph=request.ph,
            rainfall=request.rainfall
        )
        return CropPredictionResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Crop prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail="Crop prediction failed")


@app.post("/predict-disease", response_model=DiseasePredictionResponse)
async def predict_disease(file: UploadFile = File(...)):
    """
    Pest & Disease Prediction
    
    Detects plant diseases from leaf images
    """
    if disease_service is None:
        raise HTTPException(
            status_code=503,
            detail="Disease detection service is not available. Model not loaded."
        )
    
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        image_bytes = await file.read()
        result = disease_service.predict_disease(image_bytes)
        return DiseasePredictionResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Disease prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail="Disease prediction failed")


@app.post("/irrigation-schedule", response_model=IrrigationResponse)
async def get_irrigation_schedule(request: IrrigationRequest):
    """
    Smart Irrigation Scheduling
    
    Provides intelligent irrigation recommendations based on crop, soil, and weather
    """
    if irrigation_service is None:
        raise HTTPException(
            status_code=503,
            detail="Irrigation service is not available. Model not loaded."
        )
    
    try:
        result = irrigation_service.calculate_irrigation_schedule(
            crop_type=request.crop_type,
            soil_moisture=request.soil_moisture,
            temperature=request.temperature,
            humidity=request.humidity,
            rainfall=request.rainfall,
            crop_stage=request.crop_stage
        )
        return IrrigationResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Irrigation scheduling error: {str(e)}")
        raise HTTPException(status_code=500, detail="Irrigation scheduling failed")


@app.post("/pest-control", response_model=PestControlResponse)
async def get_pest_control(file: UploadFile = File(...)):
    """
    Pest & Disease Control Recommendations
    
    Provides control measures for detected diseases
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        image_bytes = await file.read()
        result = pest_service.get_control_recommendations(image_bytes)
        return PestControlResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Pest control recommendation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Pest control recommendation failed")


@app.get("/crop-patterns")
async def get_crop_patterns():
    """
    Get historical crop pattern data for the region
    """
    try:
        patterns = crop_service.get_crop_patterns()
        return {"patterns": patterns}
    except Exception as e:
        logger.error(f"Crop pattern retrieval error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve crop patterns")


@app.get("/farmer-insights")
async def get_farmer_insights():
    """
    Smart Farmer Interaction Layer
    
    Provides aggregated insights and recommendations
    """
    try:
        insights = {
            "seasonal_recommendations": crop_service.get_seasonal_recommendations(),
            "common_diseases": disease_service.get_common_diseases(),
            "irrigation_tips": irrigation_service.get_general_tips(),
            "pest_alerts": pest_service.get_active_alerts()
        }
        return insights
    except Exception as e:
        logger.error(f"Farmer insights error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve farmer insights")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)