from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class HealthResponse(BaseModel):
    status: str
    models_loaded: bool

class CropPredictionResponse(BaseModel):
    recommended_crop: str
    confidence: Optional[float] = None
    alternative_crops: Optional[List[str]] = None
    reasoning: Optional[str] = None

class DiseasePredictionResponse(BaseModel):
    disease: str
    confidence: float
    severity: Optional[str] = None
    affected_plant: Optional[str] = None
    ai_advice: Optional[str] = None

class IrrigationResponse(BaseModel):
    irrigation_needed: bool
    water_amount: float
    schedule: str
    next_irrigation: Optional[str] = None
    reasoning: Optional[str] = None
    tips: Optional[List[str]] = None
    ai_advice: Optional[str] = None

class PestControlResponse(BaseModel):
    disease: str
    confidence: Optional[float] = None
    severity: Optional[str] = None
    control_measures: Optional[List[str]] = None
    organic_solutions: Optional[List[str]] = None
    chemical_solutions: Optional[List[str]] = None
    preventive_measures: Optional[List[str]] = None
    estimated_recovery_time: Optional[str] = None
