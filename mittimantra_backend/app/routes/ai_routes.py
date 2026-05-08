from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, status
from pydantic import BaseModel, Field
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import logging
import json
import re

from app.database import get_db
from app.auth import get_current_active_user
from app.db_models import User

from app.services.crop_ai_service import crop_ai_service
from app.services.irrigation_ai_service import irrigation_ai_service
from app.services.disease_ai_service import disease_ai_service
from app.services.smart_talk_service import smart_talk_service
from app.services.weather_soil_utils import geocode, fetch_soil_data, fetch_weather
from app.utils.translation_maps import (
    translate_crop, translate_crop_list, translate_soil, get_hindi_prompt_directive
)

logger = logging.getLogger(__name__)
router = APIRouter()

# --- Request Models ---

class AICropRequest(BaseModel):
    location: str
    season: str
    priority: str
    # soil_type is now auto-detected from SoilGrids — no longer needed from user
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


# --- Endpoints ---

@router.post("/crop-suggestion")
async def get_crop_suggestion(
    request: AICropRequest
):
    """
    Get AI-enhanced crop suggestion with:
      - Auto soil intelligence from SoilGrids (no user input needed for soil type)
      - Real-time weather context from OpenWeather
      - Structured JSON response with top pick + alternatives
    """
    from app.ai_core.prompt_manager import load_prompt
    from app.services.ai_orchestrator import ai_orchestrator

    # ── Step 1: Geocode location ──────────────────────────────────────
    lat, lon = None, None
    try:
        lat, lon = geocode(request.location)
        logger.info(f"Geocoded '{request.location}' → ({lat}, {lon})")
    except Exception as exc:
        logger.warning(f"Geocoding failed for '{request.location}': {exc}")

    # ── Step 2: Fetch weather data ────────────────────────────────────
    weather_data = {}
    if lat is not None and lon is not None:
        try:
            weather_data = fetch_weather(lat, lon)
            logger.info(f"Weather fetched: {weather_data.get('temperature')}°C, {weather_data.get('condition')}")
        except Exception as exc:
            logger.warning(f"Weather fetch failed: {exc}")

    # ── Step 3: Auto-fetch soil data from SoilGrids ───────────────────
    soil_data = {}
    if lat is not None and lon is not None:
        try:
            soil_data = fetch_soil_data(lat, lon, soil_type_override=None)
            logger.info(f"Soil fetched: {soil_data.get('type')}, pH={soil_data.get('ph')}")
        except Exception as exc:
            logger.warning(f"Soil fetch failed: {exc}")
            soil_data = {"type": "Loamy Soil", "source": "fallback", "ph": None, "nitrogen": None, "organic_carbon": None}
    else:
        soil_data = {"type": "Loamy Soil", "source": "fallback", "ph": None, "nitrogen": None, "organic_carbon": None}

    # ── Step 4: Build rich, data-driven AI prompt ─────────────────────
    soil_type = soil_data.get("type", "Loamy Soil")
    soil_source = soil_data.get("source", "fallback")
    soil_ph = soil_data.get("ph")
    soil_nitrogen = soil_data.get("nitrogen")
    soil_oc = soil_data.get("organic_carbon")
    soil_clay = soil_data.get("clay_pct")
    soil_sand = soil_data.get("sand_pct")

    # Weather block
    if weather_data.get("temperature") is not None:
        weather_block = (
            f"- Temperature: {weather_data['temperature']}°C, feels like {weather_data.get('feels_like', 'N/A')}°C\n"
            f"- Humidity: {weather_data.get('humidity', 'N/A')}%\n"
            f"- Condition: {weather_data.get('condition', 'N/A')}\n"
            f"- Rainfall today: {weather_data.get('rainfall_today_mm', 0.0)} mm"
        )
        forecast_days = weather_data.get("forecast_days", [])[:5]
        if forecast_days:
            total_rain = sum(d.get("rain_mm", 0) for d in forecast_days)
            weather_block += f"\n- Expected rainfall next 5 days: {total_rain:.1f} mm"
    else:
        weather_block = "- Weather data unavailable (using regional/seasonal averages)"

    # Soil block
    soil_block = f"- Soil Type: {soil_type} (detected via {soil_source})"
    if soil_ph is not None:
        soil_block += f"\n- Soil pH: {soil_ph}"
    if soil_nitrogen is not None:
        soil_block += f"\n- Nitrogen: {soil_nitrogen} cg/kg"
    if soil_oc is not None:
        soil_block += f"\n- Organic Carbon: {soil_oc} dg/kg"
    if soil_clay is not None:
        soil_block += f"\n- Clay: {soil_clay}%, Sand: {soil_sand}%"

    # NPK block (optional user data)
    npk_block = ""
    if request.nitrogen or request.phosphorus or request.potassium:
        npk_block = (
            f"\nFarmer-provided soil nutrients:\n"
            f"- Nitrogen: {request.nitrogen} kg/ha\n"
            f"- Phosphorus: {request.phosphorus} kg/ha\n"
            f"- Potassium: {request.potassium} kg/ha"
        )

    # Language directive for Hindi
    lang_note = get_hindi_prompt_directive() if request.language == "hi" else ""

    prompt = f"""You are an expert agricultural scientist and crop advisor for Indian farmers.

A farmer from {request.location} needs smart crop recommendations for the {request.season} season.
Their profit priority: {request.priority}

=== REAL-TIME WEATHER DATA ===
{weather_block}

=== SOIL INTELLIGENCE (SoilGrids Satellite Data) ===
{soil_block}
{npk_block}

=== YOUR TASK ===
Based on the above real environmental data, recommend the best crops.

You MUST return ONLY a valid JSON object — no extra text, no markdown, no code fences.

The JSON must have EXACTLY this structure:
{{
  "top_pick": {{
    "crop": "<Best crop name>",
    "reason": "<2-3 sentence explanation of WHY this is the #1 choice given the soil, weather, season, and profit priority>"
  }},
  "alternative_crops": ["<crop2>", "<crop3>"],
  "soil_type": "<soil type name>",
  "weather_summary": "<1-2 sentence summary of current weather and its impact on farming>",
  "ai_advice": "<3-4 concise paragraphs covering: (1) why top crop suits this specific soil+weather, (2) key farming practices: sowing depth, irrigation frequency, fertilizer type+stage, (3) expected yield range and market value in India, (4) main risk factors or pests to watch — practical, farmer-friendly language>"
}}

RULES:
- Recommend crops most suitable for {request.season} season in {request.location}
- Factor in the soil pH and texture when explaining suitability
- Factor in the current weather and expected rainfall
- Highlight the ONE best crop clearly in top_pick
- Alternatives must be genuinely different crops (not varieties of the same crop)
- Use simple language a farmer can understand
- Be specific about yield, water needs, and risks
- Do NOT add any text outside the JSON object{lang_note}"""

    # ── Step 5: Call LLM ──────────────────────────────────────────────
    try:
        system_prompt = load_prompt("system_prompt.txt")
        ai_response = ai_orchestrator.get_llm_response(
            prompt=prompt,
            system_prompt=system_prompt,
            language=request.language
        )

        # ── Step 6: Parse structured JSON from AI response ────────────
        top_pick = {"crop": "Unknown", "reason": ""}
        alternative_crops = []
        parsed_soil_type = soil_type
        weather_summary = ""
        ai_advice = ai_response  # fallback

        try:
            # Strip markdown code fences if present
            clean_json = re.sub(r'```(?:json)?\s*|\s*```', '', ai_response).strip()
            # Find the outermost JSON object
            match = re.search(r'\{.*\}', clean_json, re.DOTALL)
            if match:
                clean_json = match.group(0)

            data = json.loads(clean_json)

            if isinstance(data, dict):
                top_pick = data.get("top_pick", top_pick)
                alternative_crops = data.get("alternative_crops", [])
                parsed_soil_type = data.get("soil_type", soil_type)
                weather_summary = data.get("weather_summary", "")
                ai_advice = data.get("ai_advice", ai_response)

        except Exception as parse_err:
            logger.warning(f"Failed to parse structured AI JSON: {parse_err}")
            # Attempt regex fallback to extract crop names
            crop_matches = re.findall(r'"crop"\s*:\s*"([^"]+)"', ai_response)
            if crop_matches:
                top_pick = {"crop": crop_matches[0], "reason": "AI recommended based on conditions."}
                alternative_crops = crop_matches[1:3]

        # Apply translation maps for ML label outputs
        lang = request.language
        top_crop_name = translate_crop(top_pick.get("crop", "Unknown"), lang)
        top_pick_translated = {**top_pick, "crop": top_crop_name}
        alt_crops_translated = translate_crop_list(alternative_crops, lang)
        soil_translated = translate_soil(parsed_soil_type, lang)

        return {
            "top_pick": top_pick_translated,
            "alternative_crops": alt_crops_translated,
            "soil_type": soil_translated,
            "soil_data": soil_data,
            "weather_summary": weather_summary,
            "weather_data": weather_data if weather_data else None,
            "ai_advice": ai_advice,
            "location": request.location,
            "season": request.season,
            "language": request.language,
            # Legacy fields for backward compatibility with ML mode display
            "recommended_crop": top_crop_name,
        }

    except Exception as e:
        logger.error(f"Error in crop AI: {str(e)}")
        from app.ai_core.rule_based_fallbacks import get_crop_fallback
        fallback_text = get_crop_fallback(request.location, request.season, request.language)
        fallback_crop = translate_crop("Rice", request.language)

        return {
            "top_pick": {"crop": fallback_crop, "reason": fallback_text},
            "alternative_crops": translate_crop_list(["Maize", "Wheat"], request.language),
            "soil_type": translate_soil(soil_type, request.language),
            "soil_data": soil_data,
            "weather_summary": "",
            "weather_data": weather_data if weather_data else None,
            "ai_advice": fallback_text,
            "location": request.location,
            "season": request.season,
            "language": request.language,
            "recommended_crop": fallback_crop,
            "fallback": True
        }

@router.post("/irrigation")
async def get_irrigation_advice(
    request: AIIrrigationRequest
):
    """
    Get AI-enhanced irrigation advice driven by:
      - Real-time weather data (OpenWeather API)
      - Soil intelligence (SoilGrids API)
      - Crop type, irrigation method, and AI reasoning
    
    Returns a structured response with weather summary, soil summary,
    and a detailed 7-day irrigation plan.
    """
    try:
        result = irrigation_ai_service.get_irrigation_advice(
            location=request.location,
            crop=request.crop,
            irrigation_method=request.irrigation_method,
            soil_type=request.soil_type or None,
            rainfall_pattern=request.rainfall_pattern or None,
            language=request.language,
        )
        return result
    except Exception as e:
        logger.error(f"Error in irrigation AI endpoint: {str(e)}")
        from app.ai_core.rule_based_fallbacks import get_irrigation_fallback
        fallback = get_irrigation_fallback(request.crop, request.location, request.language)
        return {
            "location":        request.location,
            "crop":            request.crop,
            "method":          request.irrigation_method,
            "weather":         None,
            "soil":            {"type": request.soil_type or "Loamy Soil", "source": "fallback"},
            "irrigation_plan": fallback,
            "language":        request.language,
            "fallback":        True,
        }

@router.post("/disease/gemini-detect")
async def detect_disease_gemini(
    file: UploadFile = File(...),
    language: str = "en"
):
    """Get Gemini AI-enhanced disease detection"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    image_bytes = await file.read()
    result = disease_ai_service.detect_disease_and_advise(
        image_bytes=image_bytes,
        language=language
    )
    result["model_used"] = "Gemini Vision"
    return result

@router.post("/disease/cnn-detect")
async def detect_disease_cnn(
    file: UploadFile = File(...),
    language: str = "en"
):
    """Get CNN model disease detection with Groq AI advice"""
    from app.services.cnn_model_service import predict as cnn_predict
    from app.services.ai_orchestrator import ai_orchestrator
    import json
    import re
    from app.utils.translation_maps import get_hindi_prompt_directive

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid image: only image files (JPG, PNG, WEBP) are accepted.")

    try:
        image_bytes = await file.read()

        # 1. Run CNN Prediction (lazy-loads model on first call)
        try:
            disease_name, confidence = await cnn_predict(image_bytes)
        except RuntimeError as cnn_err:
            err_str = str(cnn_err)
            # Re-raise as HTTP 503 for model/infra failures, 422 for bad input
            if "invalid image" in err_str.lower() or "could not be opened" in err_str.lower():
                raise HTTPException(status_code=422, detail=err_str)
            if "hugging face download failed" in err_str.lower():
                raise HTTPException(status_code=503, detail=err_str)
            if ".keras model loading failed" in err_str.lower():
                raise HTTPException(status_code=503, detail=err_str)
            if "preprocessing failed" in err_str.lower():
                raise HTTPException(status_code=422, detail=err_str)
            if "tensorflow inference failed" in err_str.lower():
                raise HTTPException(status_code=500, detail=err_str)
            raise HTTPException(status_code=500, detail=f"CNN prediction failed: {err_str}")

        if not disease_name or disease_name == "Unknown":
            disease_name = "Unknown Disease"

        # 2. Build Prompt for Groq
        lang_note = get_hindi_prompt_directive() if language == "hi" else ""

        prompt = f"""You are an expert agricultural scientist.
A farmer has uploaded an image of a plant. The CNN model has detected the following:
Disease: {disease_name}
Confidence: {confidence * 100:.2f}%

Based ONLY on this disease, generate structured agricultural guidance.

You MUST return ONLY a valid JSON object — no extra text, no markdown, no code fences.

The JSON must have EXACTLY this structure:
{{
  "model_used": "CNN + Groq",
  "disease": "{disease_name}",
  "confidence": {confidence},
  "severity": "<severity string like Low, Medium, High>",
  "description": "<1-2 sentences description of cause and symptoms>",
  "treatment_steps": ["<step 1>", "<step 2>"],
  "recommended_pesticides": ["<pesticide 1>", "<pesticide 2>"],
  "organic_solutions": ["<solution 1>", "<solution 2>"],
  "prevention_tips": ["<tip 1>", "<tip 2>"],
  "farmer_advice": "<2-3 sentence friendly advice for the farmer>"
}}

Do NOT add any text outside the JSON object.
{lang_note}"""

        # 3. Call Groq for agricultural guidance
        ai_response = ai_orchestrator.get_llm_response(
            prompt=prompt,
            system_prompt="You are an expert agricultural scientist and crop advisor for Indian farmers.",
            language=language
        )

        # 4. Parse JSON response
        result = {}
        try:
            clean_json = re.sub(r'```(?:json)?\s*|\s*```', '', ai_response).strip()
            match = re.search(r'\{.*\}', clean_json, re.DOTALL)
            if match:
                clean_json = match.group(0)
            result = json.loads(clean_json)
        except Exception as parse_err:
            logger.warning(f"Failed to parse Groq structured AI JSON: {parse_err}")
            result = {
                "model_used": "CNN + Groq",
                "disease": disease_name,
                "confidence": confidence,
                "severity": "Unknown",
                "description": ai_response,
                "treatment_steps": [],
                "recommended_pesticides": [],
                "organic_solutions": [],
                "prevention_tips": [],
                "farmer_advice": "Please consult a local agricultural expert for detailed advice on this disease."
            }

        # Ensure required fields are always present
        result["source"]     = "cnn"
        result["language"]   = language
        result["model_used"] = "CNN + Groq"

        return result

    except HTTPException:
        raise   # pass-through, already well-formed
    except Exception as e:
        logger.error(f"Unexpected error in CNN disease detection: {str(e)}")
        raise HTTPException(status_code=500, detail=f"CNN Disease detection failed: {str(e)}")

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
