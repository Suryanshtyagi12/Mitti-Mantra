# app/services/irrigation_service.py
"""
Smart Irrigation Scheduling Service
Provides intelligent irrigation recommendations
"""

import logging
from typing import Dict, List
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class IrrigationService:
    """Service for smart irrigation scheduling"""
    
    # Crop water requirements (mm/day) by growth stage
    CROP_WATER_REQUIREMENTS = {
        "rice": {
            "seedling": 8,
            "vegetative": 10,
            "flowering": 12,
            "fruiting": 10,
            "maturity": 6
        },
        "wheat": {
            "seedling": 4,
            "vegetative": 6,
            "flowering": 8,
            "fruiting": 6,
            "maturity": 3
        },
        "maize": {
            "seedling": 5,
            "vegetative": 7,
            "flowering": 9,
            "fruiting": 8,
            "maturity": 4
        },
        "cotton": {
            "seedling": 4,
            "vegetative": 6,
            "flowering": 8,
            "fruiting": 9,
            "maturity": 5
        },
        "tomato": {
            "seedling": 3,
            "vegetative": 5,
            "flowering": 7,
            "fruiting": 8,
            "maturity": 5
        },
        "potato": {
            "seedling": 4,
            "vegetative": 6,
            "flowering": 7,
            "fruiting": 8,
            "maturity": 4
        }
    }
    
    # Default water requirement for unknown crops
    DEFAULT_WATER_REQUIREMENT = {
        "seedling": 4,
        "vegetative": 6,
        "flowering": 7,
        "fruiting": 7,
        "maturity": 4
    }
    
    def __init__(self):
        """Initialize irrigation service"""
        logger.info("Irrigation service initialized")
    
    def calculate_irrigation_schedule(
        self,
        crop_type: str,
        soil_moisture: float,
        temperature: float,
        humidity: float,
        rainfall: float,
        crop_stage: str
    ) -> Dict:
        """
        Calculate smart irrigation schedule
        
        Args:
            crop_type: Type of crop planted
            soil_moisture: Current soil moisture percentage
            temperature: Current temperature in Celsius
            humidity: Current relative humidity
            rainfall: Recent rainfall in mm
            crop_stage: Current crop growth stage
            
        Returns:
            Dictionary containing irrigation recommendations
        """
        try:
            # Get crop water requirement
            crop_type_lower = crop_type.lower()
            if crop_type_lower in self.CROP_WATER_REQUIREMENTS:
                water_req = self.CROP_WATER_REQUIREMENTS[crop_type_lower][crop_stage]
            else:
                water_req = self.DEFAULT_WATER_REQUIREMENT[crop_stage]
            
            # Calculate evapotranspiration adjustment
            et_factor = self._calculate_et_factor(temperature, humidity)
            adjusted_water_req = water_req * et_factor
            
            # Account for recent rainfall
            effective_rainfall = rainfall * 0.8  # 80% efficiency
            net_water_needed = max(0, adjusted_water_req - effective_rainfall)
            
            # Determine if irrigation is needed based on soil moisture
            optimal_moisture = self._get_optimal_moisture(crop_type_lower, crop_stage)
            irrigation_needed = soil_moisture < optimal_moisture
            
            # Calculate water amount (liters per square meter)
            if irrigation_needed:
                water_amount = net_water_needed
            else:
                water_amount = 0
            
            # Generate schedule
            schedule = self._generate_schedule(
                irrigation_needed, crop_stage, temperature, soil_moisture
            )
            
            # Calculate next irrigation time
            next_irrigation = self._calculate_next_irrigation(
                soil_moisture, optimal_moisture, temperature, rainfall
            )
            
            # Generate reasoning
            reasoning = self._generate_reasoning(
                irrigation_needed, soil_moisture, optimal_moisture,
                temperature, rainfall, crop_stage
            )
            
            # Get additional tips
            tips = self._get_irrigation_tips(crop_type_lower, crop_stage, temperature)
            
            return {
                "irrigation_needed": irrigation_needed,
                "water_amount": round(water_amount, 2),
                "schedule": schedule,
                "next_irrigation": next_irrigation,
                "reasoning": reasoning,
                "tips": tips
            }
            
        except Exception as e:
            logger.error(f"Irrigation calculation error: {str(e)}")
            raise ValueError(f"Failed to calculate irrigation schedule: {str(e)}")
    
    def _calculate_et_factor(self, temperature: float, humidity: float) -> float:
        """Calculate evapotranspiration factor"""
        # Higher temperature and lower humidity increase ET
        temp_factor = 1 + (temperature - 25) * 0.02
        humidity_factor = 1 + (75 - humidity) * 0.005
        return max(0.5, min(2.0, temp_factor * humidity_factor))
    
    def _get_optimal_moisture(self, crop_type: str, crop_stage: str) -> float:
        """Get optimal soil moisture for crop"""
        # Rice requires higher moisture
        if crop_type == "rice":
            return 80 if crop_stage in ["vegetative", "flowering"] else 70
        # Other crops
        return 60 if crop_stage in ["flowering", "fruiting"] else 50
    
    def _generate_schedule(
        self, irrigation_needed: bool, crop_stage: str,
        temperature: float, soil_moisture: float
    ) -> str:
        """Generate irrigation schedule recommendation"""
        if not irrigation_needed:
            return "No irrigation needed currently. Monitor soil moisture levels."
        
        if temperature > 35:
            return "Irrigate early morning (5-7 AM) or late evening (6-8 PM) to minimize evaporation"
        elif crop_stage in ["flowering", "fruiting"]:
            return "Irrigate every 2-3 days during flowering/fruiting stage"
        elif soil_moisture < 30:
            return "Immediate irrigation required. Soil moisture critically low."
        else:
            return "Irrigate every 3-4 days based on weather conditions"
    
    def _calculate_next_irrigation(
        self, soil_moisture: float, optimal_moisture: float,
        temperature: float, rainfall: float
    ) -> str:
        """Calculate next irrigation time"""
        if soil_moisture >= optimal_moisture:
            days = 4 if rainfall > 10 else 3
        elif soil_moisture < 40:
            days = 1
        else:
            days = 2
        
        next_date = datetime.now() + timedelta(days=days)
        return next_date.strftime("%Y-%m-%d %H:%M")
    
    def _generate_reasoning(
        self, irrigation_needed: bool, soil_moisture: float,
        optimal_moisture: float, temperature: float,
        rainfall: float, crop_stage: str
    ) -> str:
        """Generate reasoning for irrigation recommendation"""
        reasons = []
        
        if irrigation_needed:
            reasons.append(f"Current soil moisture ({soil_moisture}%) is below optimal level ({optimal_moisture}%)")
        else:
            reasons.append(f"Soil moisture ({soil_moisture}%) is adequate")
        
        if rainfall > 0:
            reasons.append(f"Recent rainfall: {rainfall}mm")
        
        if temperature > 32:
            reasons.append("High temperature increases water requirement")
        
        if crop_stage in ["flowering", "fruiting"]:
            reasons.append(f"Critical {crop_stage} stage requires consistent moisture")
        
        return ". ".join(reasons)
    
    def _get_irrigation_tips(self, crop_type: str, crop_stage: str, temperature: float) -> List[str]:
        """Get additional irrigation tips"""
        tips = []
        
        if temperature > 35:
            tips.append("Use mulching to reduce water evaporation")
            tips.append("Consider drip irrigation for water efficiency")
        
        if crop_stage in ["flowering", "fruiting"]:
            tips.append("Maintain consistent moisture during flowering/fruiting")
            tips.append("Avoid water stress during this critical stage")
        
        if crop_type == "rice":
            tips.append("Maintain standing water of 2-3 inches during vegetative stage")
        
        tips.append("Check soil moisture regularly using a soil moisture meter")
        tips.append("Irrigate based on crop need, not on a fixed schedule")
        
        return tips
    
    def get_general_tips(self) -> List[str]:
        """Get general irrigation tips"""
        return [
            "Best time to irrigate: Early morning (5-7 AM) or late evening (6-8 PM)",
            "Use drip or sprinkler irrigation for water efficiency",
            "Apply mulch to reduce evaporation and maintain soil moisture",
            "Monitor weather forecasts to adjust irrigation schedules",
            "Avoid over-irrigation which can lead to waterlogging and diseases"
        ]