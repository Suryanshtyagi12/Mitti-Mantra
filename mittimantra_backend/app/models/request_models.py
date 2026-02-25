from pydantic import BaseModel, Field
from typing import Optional

class CropPredictionRequest(BaseModel):
    nitrogen: float
    phosphorus: float
    potassium: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float

class IrrigationRequest(BaseModel):
    crop_type: str
    soil_moisture: float
    temperature: float
    humidity: float
    rainfall: float
    crop_stage: str
