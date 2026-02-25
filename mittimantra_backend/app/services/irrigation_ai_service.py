import logging
from typing import Dict, Any
from .irrigation_service import IrrigationService
from .ai_orchestrator import ai_orchestrator
from app.ai_core.prompt_manager import load_prompt
from app.ai_core.rule_based_fallbacks import get_irrigation_fallback

logger = logging.getLogger(__name__)

class IrrigationAIService:
    def __init__(self):
        self.irrigation_service = IrrigationService()

    def get_irrigation_advice(
        self,
        crop_type: str,
        soil_moisture: float,
        temperature: float,
        humidity: float,
        rainfall: float,
        crop_stage: str,
        language: str = "en",
        location: str = "Unknown"
    ) -> Dict[str, Any]:
        """
        Get irrigation advice combining rule-based calculation and AI reasoning.
        """
        plan = {} # Initialize plan to ensure it's always defined for the except block
        try:
            # 1. Rule-based Calculation
            plan = self.irrigation_service.calculate_irrigation_schedule(
                crop_type, soil_moisture, temperature, humidity, rainfall, crop_stage
            )

            # 2. AI Reasoning
            prompt_template = load_prompt("irrigation_prompt.txt")
            # If load fails, use default string logic (implicit in load_prompt returning empty string? No, handle it)
            if not prompt_template:
                 prompt_template = "Provide irrigation advice for {crop}."

            # Construct Prompt
            prompt = f"""
            Based on:
            - Crop: {crop_type} ({crop_stage})
            - Conditions: Moisture {soil_moisture}%, Temp {temperature}C, Rain {rainfall}mm
            - Location: {location}
            - Rule-based Assessment:
              - Needed: {plan['irrigation_needed']}
              - Amount: {plan.get('water_amount', 0)} L/m2
              - Schedule: {plan.get('schedule', 'N/A')}
            
            Please provide a detailed irrigation plan.
            """
            
            # Using prompt template if it fits, but our template has specific Slots.
            # "irrigation_prompt.txt": Inputs: Location, Crop, Soil Type, Rainfall Pattern.
            # We don't have soil type in request? Ah, we do in frontend but not in parameters?
            # Router defines AIIrrigationRequest without soil_type? 
            # I checked ai_routes.py: AIIrrigationRequest has crop, moisture, temp, humidity, rainfall, stage. NO soil_type.
            # I should assume "General" or ask frontend to send it. For now, "Unknown".
            
            # Reuse the specialized prompt template or the custom one above?
            # The custom one above includes the rule-based assessment which is critical.
            # I will append the rule-based info to the prompt template input.
            
            # Re-read irrigation_prompt.txt requirement: "Recommend BEST method... Frequency... Timing"
            
            final_prompt = prompt # Use the specific prompt that incorporates rule-based data
            
            system_prompt = load_prompt("system_prompt.txt")
            
            ai_advice = ai_orchestrator.get_llm_response(
                prompt=final_prompt,
                system_prompt=system_prompt,
                language=language
            )

            return {
                **plan,
                "ai_advice": ai_advice,
                "language": language
            }

        except Exception as e:
            logger.error(f"Error in irrigation AI service: {str(e)}")
            # Fallback
            try:
                 if 'plan' in locals():
                    fallback = get_irrigation_fallback(crop_type, location=location, lang=language)
                    return {
                        "irrigation_needed": plan['irrigation_needed'],
                        "water_amount": plan.get('water_amount', 0),
                        "schedule": plan.get('schedule', 'N/A'),
                        "rule_based_details": plan,
                        "ai_advice": f"AI advice unavailable. {fallback}",
                        "language": language
                    }
                 else:
                     raise e
            except:
                raise ValueError("Failed to generate irrigation advice.")

irrigation_ai_service = IrrigationAIService()
