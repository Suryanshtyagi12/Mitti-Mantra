"""
app/services/weather_soil_utils.py

Utility helpers for the Irrigation AI service:
  - geocode(location)                 → (lat, lon) | (None, None)
  - fetch_weather(lat, lon)           → current weather + 7-day forecast dict
  - fetch_soil_data(lat, lon, soil_type_override) → soil type + chemistry dict
"""

import os
import logging
import requests
from typing import Optional, Tuple, Dict, Any, List

logger = logging.getLogger(__name__)

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
_GEOCODE_URL  = "http://api.openweathermap.org/geo/1.0/direct"
_WEATHER_URL  = "https://api.openweathermap.org/data/2.5/weather"
_FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"
_SOILGRIDS_URL = "https://rest.isric.org/soilgrids/v2.0/properties/query"

TIMEOUT = 8   # seconds per HTTP call


# ---------------------------------------------------------------------------
# Geocoding
# ---------------------------------------------------------------------------

def geocode(location: str) -> Tuple[Optional[float], Optional[float]]:
    """Convert a location string to (latitude, longitude) via OpenWeather Geocoding API."""
    try:
        resp = requests.get(
            _GEOCODE_URL,
            params={"q": location, "limit": 1, "appid": OPENWEATHER_API_KEY},
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
        if data:
            lat, lon = data[0]["lat"], data[0]["lon"]
            logger.info(f"Geocoded '{location}' → ({lat}, {lon})")
            return lat, lon
        logger.warning(f"Geocoding returned no results for: {location}")
    except Exception as exc:
        logger.error(f"Geocoding error for '{location}': {exc}")
    return None, None


# ---------------------------------------------------------------------------
# Weather fetching — current + 7-day forecast
# ---------------------------------------------------------------------------

def fetch_weather(lat: float, lon: float) -> Dict[str, Any]:
    """
    Fetch current weather + 7-day daily outlook.

    Returns a dict with keys:
      temperature, feels_like, humidity, rainfall_today_mm, condition,
      wind_speed, forecast_days (list of up to 7 day dicts)

    Each forecast day dict:
      { date, condition, rain_mm, temp_max, temp_min }
    """
    result: Dict[str, Any] = {
        "temperature": None,
        "feels_like": None,
        "humidity": None,
        "rainfall_today_mm": 0.0,
        "condition": "Unknown",
        "wind_speed": None,
        "forecast_days": [],
    }

    # --- Current weather ---
    try:
        cw = requests.get(
            _WEATHER_URL,
            params={"lat": lat, "lon": lon, "appid": OPENWEATHER_API_KEY, "units": "metric"},
            timeout=TIMEOUT,
        )
        cw.raise_for_status()
        cw_data = cw.json()
        result["temperature"]       = round(cw_data["main"]["temp"], 1)
        result["feels_like"]        = round(cw_data["main"]["feels_like"], 1)
        result["humidity"]          = cw_data["main"]["humidity"]
        result["condition"]         = cw_data["weather"][0]["description"].title()
        result["wind_speed"]        = cw_data.get("wind", {}).get("speed")
        result["rainfall_today_mm"] = cw_data.get("rain", {}).get("1h", 0.0)
    except Exception as exc:
        logger.error(f"Current weather fetch error ({lat},{lon}): {exc}")

    # --- 7-day forecast via 5-day/3-hour API (cnt=56 → ~7 days of 8 slots each) ---
    try:
        fc = requests.get(
            _FORECAST_URL,
            params={
                "lat": lat, "lon": lon,
                "appid": OPENWEATHER_API_KEY,
                "units": "metric",
                "cnt": 56,   # 7 days × 8 intervals = 56
            },
            timeout=TIMEOUT,
        )
        fc.raise_for_status()
        fc_data = fc.json()

        days: Dict[str, Dict] = {}
        for entry in fc_data.get("list", []):
            date = entry["dt_txt"][:10]      # YYYY-MM-DD
            rain_3h = entry.get("rain", {}).get("3h", 0.0)
            if date not in days:
                days[date] = {
                    "date":      date,
                    "condition": entry["weather"][0]["description"].title(),
                    "rain_mm":   0.0,
                    "temp_max":  entry["main"]["temp_max"],
                    "temp_min":  entry["main"]["temp_min"],
                }
            days[date]["rain_mm"]  += rain_3h
            days[date]["temp_max"]  = max(days[date]["temp_max"], entry["main"]["temp_max"])
            days[date]["temp_min"]  = min(days[date]["temp_min"], entry["main"]["temp_min"])
            # Use the noon-time condition as the representative description
            if "12:00:00" in entry["dt_txt"]:
                days[date]["condition"] = entry["weather"][0]["description"].title()

        result["forecast_days"] = [
            {
                "date":      d["date"],
                "condition": d["condition"],
                "rain_mm":   round(d["rain_mm"], 1),
                "temp_max":  round(d["temp_max"], 1),
                "temp_min":  round(d["temp_min"], 1),
            }
            for d in list(days.values())[:7]
        ]
    except Exception as exc:
        logger.error(f"Forecast fetch error ({lat},{lon}): {exc}")

    return result


# ---------------------------------------------------------------------------
# Soil data — type inference + chemistry from SoilGrids
# ---------------------------------------------------------------------------

_SOIL_PROPERTIES = ["clay", "silt", "sand", "phh2o", "nitrogen", "soc"]


def fetch_soil_data(
    lat: float,
    lon: float,
    soil_type_override: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Query SoilGrids for soil texture + chemistry and infer a soil type.

    Returns:
      {
        "type":           str,   # e.g. "Loamy Soil"
        "ph":             float | None,
        "nitrogen":       float | None,   # cg/kg
        "organic_carbon": float | None,   # dg/kg
        "clay_pct":       float | None,
        "sand_pct":       float | None,
        "silt_pct":       float | None,
        "source":         str,   # "user_provided" | "SoilGrids API" | "fallback"
      }
    """
    result: Dict[str, Any] = {
        "type":           soil_type_override or "Loamy Soil",
        "ph":             None,
        "nitrogen":       None,
        "organic_carbon": None,
        "clay_pct":       None,
        "sand_pct":       None,
        "silt_pct":       None,
        "source":         "user_provided" if soil_type_override else "fallback",
    }

    try:
        params = {
            "lon":      lon,
            "lat":      lat,
            "property": _SOIL_PROPERTIES,
            "depth":    "0-30cm",
            "value":    "mean",
        }
        resp = requests.get(_SOILGRIDS_URL, params=params, timeout=TIMEOUT)
        resp.raise_for_status()
        data = resp.json()

        props: Dict[str, Optional[float]] = {}
        for layer in data.get("properties", {}).get("layers", []):
            name   = layer.get("name", "")
            depths = layer.get("depths", [])
            if depths:
                val = depths[0].get("values", {}).get("mean")
                if val is not None:
                    props[name] = val

        # Convert units
        clay = props.get("clay", 0) / 10    # g/kg → %
        silt = props.get("silt", 0) / 10
        sand = props.get("sand", 0) / 10
        ph   = props.get("phh2o", 650) / 10  # centi-pH → pH

        result["clay_pct"]       = round(clay, 1)
        result["silt_pct"]       = round(silt, 1)
        result["sand_pct"]       = round(sand, 1)
        result["ph"]             = round(ph, 1)
        result["nitrogen"]       = props.get("nitrogen")       # cg/kg
        result["organic_carbon"] = props.get("soc")            # dg/kg
        result["source"]         = "SoilGrids API"

        # Infer soil type only when user didn't specify one
        if not soil_type_override:
            result["type"] = _infer_soil_type(clay, silt, sand, ph)

        logger.info(
            f"SoilGrids → clay={clay:.0f}% silt={silt:.0f}% sand={sand:.0f}% "
            f"pH={ph:.1f} → {result['type']}"
        )

    except Exception as exc:
        logger.error(f"SoilGrids fetch error ({lat},{lon}): {exc}")
        # Keep fallback values already set

    return result


def _infer_soil_type(clay: float, silt: float, sand: float, ph: float) -> str:
    """Simple USDA-texture-triangle-inspired heuristic."""
    if clay >= 40:
        return "Clay Soil"
    if sand >= 70:
        return "Sandy Soil"
    if silt >= 50:
        return "Silty Soil"
    if 25 <= clay < 40 and sand < 45:
        return "Clay Loam Soil"
    if sand >= 50 and clay < 20:
        return "Sandy Loam Soil"
    if ph < 5.5:
        return "Acidic Loamy Soil"
    if ph > 8.0:
        return "Alkaline Alluvial Soil"
    return "Loamy Soil"
