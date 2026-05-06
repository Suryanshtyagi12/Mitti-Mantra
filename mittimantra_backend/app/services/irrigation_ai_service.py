"""
app/services/irrigation_ai_service.py

Full intelligent irrigation orchestration:
  1. Geocode the location → lat/lon
  2. Fetch real-time weather + 7-day forecast (OpenWeather)
  3. Fetch/infer soil type + chemistry (SoilGrids)
  4. Build a rich, data-driven AI prompt
  5. Call the LLM
  6. Return structured response
"""

import logging
from typing import Dict, Any, Optional

from .weather_soil_utils import geocode, fetch_weather, fetch_soil_data
from .ai_orchestrator import ai_orchestrator
from app.ai_core.prompt_manager import load_prompt
from app.ai_core.rule_based_fallbacks import get_irrigation_fallback
from app.utils.translation_maps import translate_soil, get_hindi_prompt_directive

logger = logging.getLogger(__name__)


class IrrigationAIService:
    """Intelligent irrigation advisor powered by real-time weather + soil + LLM."""

    # -----------------------------------------------------------------
    # Public entry point
    # -----------------------------------------------------------------

    def get_irrigation_advice(
        self,
        location: str,
        crop: str,
        irrigation_method: str,
        soil_type: Optional[str] = None,
        rainfall_pattern: Optional[str] = None,
        language: str = "en",
    ) -> Dict[str, Any]:
        """
        Orchestrate weather + soil data retrieval and AI reasoning.

        Returns a structured dict with keys:
          location, crop, method, weather, soil, irrigation_plan, language
        """
        weather_data: Dict[str, Any] = {}
        soil_data: Dict[str, Any] = {}

        # ── Step 1: Geocode ──────────────────────────────────────────
        lat, lon = None, None
        try:
            lat, lon = geocode(location)
        except Exception as exc:
            logger.error(f"Geocode failed for '{location}': {exc}")

        # ── Step 2: Fetch weather ────────────────────────────────────
        if lat is not None and lon is not None:
            try:
                weather_data = fetch_weather(lat, lon)
            except Exception as exc:
                logger.error(f"Weather fetch failed: {exc}")
        else:
            logger.warning("Could not geocode location; weather data will be unavailable.")

        # ── Step 3: Fetch soil data ──────────────────────────────────
        if lat is not None and lon is not None:
            try:
                soil_data = fetch_soil_data(lat, lon, soil_type_override=soil_type)
            except Exception as exc:
                logger.error(f"Soil fetch failed: {exc}")
                soil_data = {
                    "type": soil_type or "Loamy Soil",
                    "ph": None, "nitrogen": None, "organic_carbon": None,
                    "source": "fallback",
                }
        else:
            soil_data = {
                "type": soil_type or "Loamy Soil",
                "ph": None, "nitrogen": None, "organic_carbon": None,
                "source": "fallback",
            }

        # ── Step 4: Build AI prompt ──────────────────────────────────
        prompt = self._build_prompt(
            location=location,
            crop=crop,
            irrigation_method=irrigation_method,
            rainfall_pattern=rainfall_pattern,
            weather=weather_data,
            soil=soil_data,
            language=language,
        )

        # ── Step 5: Call LLM ─────────────────────────────────────────
        try:
            system_prompt = load_prompt("system_prompt.txt")
            ai_response = ai_orchestrator.get_llm_response(
                prompt=prompt,
                system_prompt=system_prompt,
                language=language,
            )
        except Exception as exc:
            logger.error(f"LLM call failed: {exc}")
            ai_response = get_irrigation_fallback(crop, location, language)

        # ── Step 6: Return structured response ───────────────────────
        return {
            "location":        location,
            "crop":            crop,
            "method":          irrigation_method,
            "weather":         weather_data if weather_data else None,
            "soil":            {**soil_data, "type": translate_soil(soil_data.get("type", ""), language)} if soil_data else None,
            "irrigation_plan": ai_response,
            "language":        language,
        }

    # -----------------------------------------------------------------
    # Prompt builder
    # -----------------------------------------------------------------

    def _build_prompt(
        self,
        location: str,
        crop: str,
        irrigation_method: str,
        rainfall_pattern: Optional[str],
        weather: Dict[str, Any],
        soil: Dict[str, Any],
        language: str = "en",
    ) -> str:
        """Build a rich, data-driven prompt for the LLM."""

        # Format weather block
        if weather.get("temperature") is not None:
            weather_block = f"""\
  - Temperature   : {weather['temperature']}°C (feels like {weather.get('feels_like', 'N/A')}°C)
  - Humidity      : {weather.get('humidity', 'N/A')}%
  - Condition     : {weather.get('condition', 'N/A')}
  - Rainfall today: {weather.get('rainfall_today_mm', 0.0)} mm
  - Wind speed    : {weather.get('wind_speed', 'N/A')} m/s"""

            forecast_lines = []
            for day in weather.get("forecast_days", [])[:7]:
                forecast_lines.append(
                    f"    {day['date']}: {day['condition']}, "
                    f"Rain {day['rain_mm']} mm, "
                    f"Max {day['temp_max']}°C / Min {day['temp_min']}°C"
                )
            if forecast_lines:
                weather_block += "\n  - 7-Day Forecast:\n" + "\n".join(forecast_lines)
        else:
            weather_block = "  - Weather data unavailable (use regional averages)"

        # Forecast rainfall summary (total expected in 7 days)
        total_forecast_rain = sum(
            d.get("rain_mm", 0) for d in weather.get("forecast_days", [])
        )
        rain_days = sum(
            1 for d in weather.get("forecast_days", []) if d.get("rain_mm", 0) > 2
        )

        # Format soil block
        soil_type = soil.get("type", "Loamy Soil")
        soil_source = soil.get("source", "fallback")
        soil_block = f"  - Soil Type: {soil_type} (source: {soil_source})"
        if soil.get("ph") is not None:
            soil_block += f"\n  - pH: {soil['ph']}"
        if soil.get("nitrogen") is not None:
            soil_block += f"\n  - Nitrogen (N): {soil['nitrogen']} cg/kg"
        if soil.get("organic_carbon") is not None:
            soil_block += f"\n  - Organic Carbon: {soil['organic_carbon']} dg/kg"

        # User's rainfall pattern override
        rainfall_note = (
            f"\nFarmer-reported rainfall pattern: {rainfall_pattern}"
            if rainfall_pattern
            else ""
        )

        prompt = f"""
You are an expert agricultural irrigation advisor for Indian farmers.

A farmer needs irrigation guidance. Use ALL the data below to give a precise, practical recommendation.

=== FARMER CONTEXT ===
- Location         : {location}
- Crop             : {crop}
- Irrigation Method: {irrigation_method}
{rainfall_note}

=== REAL-TIME WEATHER DATA ===
{weather_block}

  - Total expected rainfall (next 7 days): {total_forecast_rain:.1f} mm across {rain_days} rainy days

=== SOIL DATA ===
{soil_block}

=== YOUR TASK ===
Based on this real weather and soil data, provide a complete, practical irrigation plan.

Structure your response EXACTLY as follows (use these section headers):

### 🌧️ Irrigation Decision
State clearly: **Irrigate NOW** OR **Wait X days** — and the main reason.

### 💧 Water Requirement
Estimated water needed per irrigation cycle (litres/acre or mm), based on crop stage and soil type.

### ⏰ Best Time to Irrigate
Specific time (e.g., 5–7 AM), and why (evaporation, heat stress, etc.)

### 📅 7-Day Irrigation Schedule
A day-by-day recommendation considering the forecast:
| Day | Date | Action | Reason |
|-----|------|--------|--------|
(Fill in 7 rows)

### ⚠️ Rainfall Warnings
Based on the forecast data, warn if:
- Rain is expected in next 2–3 days (skip irrigation)
- No rain for 5+ days (increase frequency)
- Overwatering risk

### 🌱 Crop-Specific Tips
2–3 tips specific to {crop} irrigation needs.

### 🔧 Method Efficiency
Brief note on whether {irrigation_method} is ideal for {crop} and {soil_type}, with one improvement tip if needed.

IMPORTANT RULES:
- Be specific and data-driven — reference the actual temperature, humidity, and rainfall numbers above
- Use simple, farmer-friendly language (no heavy jargon)
- Keep each section concise — farmers need quick, actionable advice
- Disclaimer: "This is AI-generated advice. Consult your local KVK for critical decisions."
"""
        if language == "hi":
            prompt += get_hindi_prompt_directive()
        return prompt.strip()


# Singleton instance
irrigation_ai_service = IrrigationAIService()
