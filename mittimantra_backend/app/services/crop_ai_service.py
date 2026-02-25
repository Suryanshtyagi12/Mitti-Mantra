import logging
from typing import Dict, Any
from .crop_service import CropRecommendationService
from .ai_orchestrator import ai_orchestrator
from app.ai_core.prompt_manager import load_prompt
from app.ai_core.rule_based_fallbacks import get_crop_fallback

logger = logging.getLogger(__name__)

class CropAIService:
    def __init__(self):
        self.ml_service = CropRecommendationService()

    def get_crop_recommendation(
        self,
        nitrogen: float,
        phosphorus: float,
        potassium: float,
        temperature: float,
        humidity: float,
        ph: float,
        rainfall: float,
        language: str = "en",
        location: str = "Unknown"
    ) -> Dict[str, Any]:
        """
        Get crop recommendation combining ML model and AI reasoning.
        """
        try:
            # 1. Get ML Prediction
            ml_result = self.ml_service.predict_crop(
                nitrogen, phosphorus, potassium,
                temperature, humidity, ph, rainfall
            )
            
            recommended_crop = ml_result['recommended_crop']
            confidence = ml_result.get('confidence', 0.0)

            # 2. Generate AI Advice
            # We construct a dynamic prompt here to explain the ML result
            # distinct from the 'crop_prompt.txt' which is for general location-based suggestions.
            prompt = f"""
            You are an expert agricultural scientist.
            Based on the following soil and weather conditions:
            - Nitrogen: {nitrogen}
            - Phosphorus: {phosphorus}
            - Potassium: {potassium}
            - Temperature: {temperature}°C
            - Humidity: {humidity}%
            - pH: {ph}
            - Rainfall: {rainfall}mm
            - Location: {location}
            
            The machine learning model has recommended: {recommended_crop} with {confidence*100:.2f}% confidence.
            
            Please provide a detailed explanation for this recommendation.
            Also provide:
            1. Key benefits of growing {recommended_crop} in these conditions.
            2. Required farming practices (sowing, irrigation, harvesting).
            3. Estimated yield and market value (general estimates for India).
            4. Potential risks or pests to watch out for.
            
            Format the response as a clear, farmer-friendly advice.
            Use simple language.
            """
            
            system_prompt = load_prompt("system_prompt.txt")
            
            ai_advice = ai_orchestrator.get_llm_response(
                prompt=prompt,
                system_prompt=system_prompt,
                language=language
            )
            
            return {
                "recommended_crop": recommended_crop,
                "confidence": confidence,
                "ml_details": ml_result,
                "ai_advice": ai_advice,
                "language": language
            }
            
        except Exception as e:
            logger.error(f"Error in crop AI service: {str(e)}")
            # Fallback to simple ML result + Rule based fallback text
            try:
                # If ml_service was successful but AI failed
                if 'ml_result' in locals():
                    fallback_text = get_crop_fallback(location, "Current Season", lang=language)
                    return {
                        "recommended_crop": ml_result['recommended_crop'],
                        "confidence": ml_result.get('confidence', 0.0),
                        "ml_details": ml_result,
                        "ai_advice": f"AI unavailable. {fallback_text}",
                        "language": language
                    }
                else:
                    raise e
            except:
                raise ValueError("Failed to generate crop recommendation.")

crop_ai_service = CropAIService()
