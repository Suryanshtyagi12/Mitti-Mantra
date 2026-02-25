import logging
from typing import Dict, Any
from .disease_service import DiseaseDetectionService
from .ai_orchestrator import ai_orchestrator
from app.ai_core.prompt_manager import load_prompt
from app.ai_core.rule_based_fallbacks import get_disease_fallback

logger = logging.getLogger(__name__)

class DiseaseAIService:
    def __init__(self):
        self.disease_service = DiseaseDetectionService()

    def detect_disease_and_advise(
        self,
        image_bytes: bytes,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Hybrid Detection:
        1. Local ML Model (Fast, Offline-capable)
        2. Gemini Vision (Refinement, Detailed Advice)
        """
        try:
            # 1. Local ML Prediction
            ml_result = self.disease_service.predict_disease(image_bytes)
            
            # 2. Extract results
            disease_name = ml_result['disease']
            confidence = ml_result['confidence']
            is_healthy = disease_name.lower() == 'healthy' or disease_name.lower() == 'background'
            
            # 3. Construct Prompt for Gemini
            # We use the ML result as context for Gemini to specificy or confirm
            prompt_template = load_prompt("disease_prompt.txt")
            prompt = prompt_template.format(crop_name="Detected: " + disease_name)
            
            # Add context about ML prediction
            prompt += f"\n\nContext from Local ML Model: Detected '{disease_name}' with {confidence*100:.1f}% confidence."
            
            # 4. Call Gemini Vision via Agent
            # Note: analyze_image in orchestrator uses Gemini Vision
            ai_advice = ai_orchestrator.analyze_image(
                image_bytes=image_bytes,
                prompt=prompt,
                language=language
            )

            return {
                "disease": disease,
                "plant": plant,
                "confidence": confidence,
                "severity": severity,
                "ml_details": ml_result,
                "ai_advice": ai_advice,
                "language": language
            }
            
        except Exception as e:
            logger.error(f"Error in disease AI service: {str(e)}")
            # Fallback
            try:
                if 'ml_result' in locals():
                     return {
                        "disease": ml_result['disease'],
                        "plant": ml_result['affected_plant'],
                        "confidence": ml_result['confidence'],
                        "severity": ml_result['severity'],
                        "ml_details": ml_result,
                        "ai_advice": f"AI advice unavailable. Detected {ml_result['disease']}.",
                        "language": language
                    }
                else:
                    raise e
            except:
                raise ValueError("Failed to analyze disease.")

disease_ai_service = DiseaseAIService()
