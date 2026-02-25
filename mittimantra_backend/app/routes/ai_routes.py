from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, status
from pydantic import BaseModel, Field
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import logging

from app.database import get_db
from app.auth import get_current_active_user
from app.db_models import User

from app.services.crop_ai_service import crop_ai_service
from app.services.irrigation_ai_service import irrigation_ai_service
from app.services.disease_ai_service import disease_ai_service
from app.services.smart_talk_service import smart_talk_service
from app.services.track_farming_service import track_farming_service
from app.services.risk_alert_service import risk_alert_service

logger = logging.getLogger(__name__)
router = APIRouter()

# --- Request Models ---

class AICropRequest(BaseModel):
    location: str
    season: str
    priority: str
    soil_type: Optional[str] = None
    nitrogen: Optional[float] = 0
    phosphorus: Optional[float] = 0
    potassium: Optional[float] = 0
    language: str = "en"

class AIIrrigationRequest(BaseModel):
    location: str
    crop: str
    irrigation_method: str
    soil_type: Optional[str] = None
    rainfall_pattern: Optional[str] = None
    language: str = "en"

class SmartTalkRequest(BaseModel):
    query: str
    language: str = "en"
    context: Optional[dict] = None

class TrackFarmingCreate(BaseModel):
    crop_name: str
    location: str
    soil_type: str
    fertilizer: str
    planting_date: str # Expecting YYYY-MM-DD string from frontend
    language: str = "en"

# --- Endpoints ---

@router.post("/crop-suggestion")
async def get_crop_suggestion(
    request: AICropRequest
):
    """Get AI-enhanced crop suggestion based on location and optional NPK data"""
    # Use Crop AI service with location-based approach
    from app.ai_core.prompt_manager import load_prompt
    from app.services.ai_orchestrator import ai_orchestrator
    
    prompt_template = load_prompt("crop_prompt.txt")
    
    # Construct prompt with available data
    prompt = f"""
Location: {request.location}
Season: {request.season}
Profit Priority: {request.priority}
Soil Type: {request.soil_type or 'Not specified'}
"""
    
    if request.nitrogen or request.phosphorus or request.potassium:
        prompt += f"""
Soil Nutrients (if provided):
- Nitrogen: {request.nitrogen} kg/ha
- Phosphorus: {request.phosphorus} kg/ha  
- Potassium: {request.potassium} kg/ha
"""
    
    prompt += f"""
{{
  "task": "crop_recommendation",
  "instruction": "Based on the provided farmer information, recommend the best crops.",
  "requirements": {{
    "crop_count": 3,
    "rules": [
      "Recommend ONLY the top 3 crops",
      "Be concise and practical",
      "Do NOT give long explanations",
      "If soil or water information is missing, clearly state assumptions"
    ],
    "per_crop_details": {{
      "why_suitable": "1-2 lines explaining suitability for the given zone",
      "best_known_for": ["Yield", "Profit", "Water Efficiency"],
      "fertilizer_recommendation": {{
        "type": "Preferred fertilizer type",
        "stage": ["early", "mid", "late"]
      }}
    }}
  }},
  "output_format": {{
    "structure": {{
      "crop_name": "<Crop Name>",
      "why_suitable": "<Short explanation>",
      "best_for": "<Yield | Profit | Water Efficiency>",
      "fertilizer": "<Fertilizer Type> at <Stage>"
    }},
    "repeat": 3
  }},
  "notes": [
    "Do not include any additional crops",
    "Avoid technical or scientific jargon",
    "Use simple farmer-friendly language"
  ]
}}
"""

    
    try:
        system_prompt = load_prompt("system_prompt.txt")
        ai_response = ai_orchestrator.get_llm_response(
            prompt=prompt,
            system_prompt=system_prompt,
            language=request.language
        )
        
        # Parse JSON from AI Response
        import json
        import re
        
        recommended_crop = "Unknown"
        alternatives = []
        
        try:
            # Clean possible markdown code blocks
            clean_json = re.sub(r'```json\s*|\s*```', '', ai_response).strip()
            # Find list bracket if any
            match = re.search(r'\[.*\]', clean_json, re.DOTALL)
            if match:
                clean_json = match.group(0)
            
            data = json.loads(clean_json)
            
            # Handle list response
            if isinstance(data, list) and len(data) > 0:
                recommended_crop = data[0].get("crop_name", "Unknown")
                alternatives = [item.get("crop_name") for item in data[1:] if "crop_name" in item]
            elif isinstance(data, dict):
                # Maybe wrapped in a key
                for key, val in data.items():
                    if isinstance(val, list) and len(val) > 0:
                         recommended_crop = val[0].get("crop_name", "Unknown")
                         alternatives = [item.get("crop_name") for item in val[1:] if "crop_name" in item]
                         break
                    elif key == "crop_name":
                         recommended_crop = val
        except Exception as e:
            logger.warning(f"Failed to parse AI JSON: {e}")
            # Regex Fallback
            crops = re.findall(r'"crop_name":\s*"([^"]+)"', ai_response)
            if crops:
                recommended_crop = crops[0]
                alternatives = crops[1:]
        
        return {
            "recommended_crop": recommended_crop,
            "alternative_crops": alternatives,
            "ai_advice": ai_response, # Keep full text/JSON as advice/debug
            "location": request.location,
            "season": request.season,
            "language": request.language
        }
    except Exception as e:
        logger.error(f"Error in crop AI: {str(e)}")
        from app.ai_core.rule_based_fallbacks import get_crop_fallback
        fallback_text = get_crop_fallback(request.location, request.season, request.language)
        
        # Extract crops from fallback text
        # Format: "...consider: Crop1, Crop2, Crop3..."
        import re
        crops = []
        if ':' in fallback_text:
            parts = fallback_text.split(':')[-1].split('.')[0]
            crops = [c.strip() for c in parts.split(',')]
            
        rec_crop = crops[0] if crops else "Rice"
        alts = crops[1:] if len(crops) > 1 else []
        
        return {
            "recommended_crop": rec_crop,
            "alternative_crops": alts,
            "ai_advice": fallback_text,
            "location": request.location,
            "season": request.season,
            "language": request.language,
            "fallback": True
        }

@router.post("/irrigation")
async def get_irrigation_advice(
    request: AIIrrigationRequest
):
    """Get AI-enhanced irrigation advice based on location and crop"""
    from app.ai_core.prompt_manager import load_prompt
    from app.services.ai_orchestrator import ai_orchestrator
    
    # Construct prompt with available data
    prompt = f"""
Location: {request.location}
Crop: {request.crop}
Preferred Irrigation Method: {request.irrigation_method}
Soil Type: {request.soil_type or 'Typical for this region'}
Rainfall Pattern: {request.rainfall_pattern or 'Moderate rainfall'}

Based on the above information, provide a detailed irrigation plan including:
1. Best irrigation method for this crop and location
2. Frequency and timing of irrigation
3. Estimated water requirements
4. Tips to conserve water
"""
    
    try:
        system_prompt = load_prompt("system_prompt.txt")
        ai_response = ai_orchestrator.get_llm_response(
            prompt=prompt,
            system_prompt=system_prompt,
            language=request.language
        )
        
        return {
            "irrigation_plan": ai_response,
            "location": request.location,
            "crop": request.crop,
            "method": request.irrigation_method,
            "language": request.language
        }
    except Exception as e:
        logger.error(f"Error in irrigation AI: {str(e)}")
        from app.ai_core.rule_based_fallbacks import get_irrigation_fallback
        fallback = get_irrigation_fallback(request.crop, request.location, request.language)
        return {
            "irrigation_plan": fallback,
            "location": request.location,
            "crop": request.crop,
            "language": request.language,
            "fallback": True
        }

@router.post("/disease")
async def detect_disease(
    file: UploadFile = File(...),
    language: str = "en"
):
    """Get AI-enhanced disease detection"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    image_bytes = await file.read()
    return disease_ai_service.detect_disease_and_advise(
        image_bytes=image_bytes,
        language=language
    )

@router.post("/smart-talk")
async def smart_talk(
    request: SmartTalkRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Get conversational AI response"""
    return smart_talk_service.get_smart_response(
        user_query=request.query,
        language=request.language,
        context=request.context
    )

@router.post("/track-farming")
async def add_farming_record(
    request: TrackFarmingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Add a new farming record"""
    return track_farming_service.create_record(
        db=db,
        user_id=current_user.id,
        data=request.dict()
    )

@router.get("/track-farming")
async def get_farming_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all farming records for the current user"""
    return track_farming_service.get_records(db, current_user.id)

@router.post("/track-farming/{record_id}/advice")
async def get_farming_advice(
    record_id: int,
    language: str = "en",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get AI advice for a specific farming record"""
    advice = track_farming_service.get_advice(db, record_id, language)
    if not advice:
        raise HTTPException(status_code=404, detail="Record not found")
    return advice
