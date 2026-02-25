# app/services/pest_service.py
"""
Pest Prediction and Control Service
Provides pest control recommendations based on disease detection
"""

import logging
from typing import Dict, List
from app.services.disease_service import DiseaseDetectionService

logger = logging.getLogger(__name__)


class PestPredictionService:
    """Service for pest prediction and control recommendations"""
    
    # Control measures database
    CONTROL_MEASURES = {
        "Early_blight": {
            "organic": [
                "Remove and destroy infected leaves",
                "Apply copper-based fungicides",
                "Use Trichoderma as biological control",
                "Spray neem oil solution (5ml/liter)"
            ],
            "chemical": [
                "Mancozeb 75% WP @ 2.5g/liter",
                "Chlorothalonil 75% WP @ 2g/liter",
                "Azoxystrobin 23% SC @ 1ml/liter"
            ],
            "preventive": [
                "Practice crop rotation with non-solanaceous crops",
                "Maintain proper plant spacing for air circulation",
                "Use disease-resistant varieties",
                "Apply mulch to prevent soil splash"
            ],
            "severity": "Medium to High",
            "recovery_time": "2-3 weeks with proper treatment"
        },
        "Late_blight": {
            "organic": [
                "Remove infected plants immediately",
                "Apply copper fungicide preventively",
                "Use Bacillus subtilis as biocontrol",
                "Ensure good drainage"
            ],
            "chemical": [
                "Metalaxyl + Mancozeb 72% WP @ 2.5g/liter",
                "Cymoxanil + Mancozeb 72% WP @ 2g/liter",
                "Dimethomorph 50% WP @ 1.5g/liter"
            ],
            "preventive": [
                "Plant resistant varieties",
                "Avoid overhead irrigation",
                "Monitor weather for blight-favorable conditions",
                "Destroy volunteer plants and cull piles"
            ],
            "severity": "Very High",
            "recovery_time": "Difficult to recover; prevention is key"
        },
        "Leaf_Blast": {
            "organic": [
                "Remove infected leaves",
                "Apply Pseudomonas fluorescens @ 10g/liter",
                "Use silicon-based fertilizers to strengthen plants",
                "Spray cow urine solution (1:10 ratio)"
            ],
            "chemical": [
                "Tricyclazole 75% WP @ 0.6g/liter",
                "Carbendazim 50% WP @ 1g/liter",
                "Isoprothiolane 40% EC @ 1.5ml/liter"
            ],
            "preventive": [
                "Use resistant rice varieties",
                "Avoid excessive nitrogen application",
                "Maintain optimal water levels",
                "Clean field bunds and remove alternate hosts"
            ],
            "severity": "High",
            "recovery_time": "3-4 weeks"
        },
        "Brown_Spot": {
            "organic": [
                "Improve soil fertility with organic matter",
                "Apply potash to increase resistance",
                "Remove infected leaves",
                "Spray Trichoderma suspension"
            ],
            "chemical": [
                "Mancozeb 75% WP @ 2g/liter",
                "Edifenphos 50% EC @ 1ml/liter",
                "Propiconazole 25% EC @ 1ml/liter"
            ],
            "preventive": [
                "Use certified disease-free seeds",
                "Apply balanced fertilizers",
                "Maintain proper drainage",
                "Avoid water stress"
            ],
            "severity": "Medium",
            "recovery_time": "2-3 weeks"
        },
        "Bacterial_spot": {
            "organic": [
                "Remove and destroy infected plant parts",
                "Apply copper-based bactericides",
                "Use Pseudomonas fluorescens",
                "Spray garlic extract solution"
            ],
            "chemical": [
                "Streptomycin sulfate @ 0.5g/liter",
                "Copper oxychloride 50% WP @ 3g/liter",
                "Kasugamycin 3% SL @ 2ml/liter"
            ],
            "preventive": [
                "Use disease-free seeds",
                "Practice 2-3 year crop rotation",
                "Avoid overhead irrigation",
                "Disinfect tools between plants"
            ],
            "severity": "Medium",
            "recovery_time": "2-3 weeks"
        },
        "healthy": {
            "organic": [],
            "chemical": [],
            "preventive": [
                "Continue regular monitoring",
                "Maintain good agricultural practices",
                "Ensure balanced nutrition",
                "Practice preventive spraying during disease-prone seasons"
            ],
            "severity": "None",
            "recovery_time": "N/A - Plant is healthy"
        }
    }
    
    def __init__(self):
        """Initialize pest prediction service"""
        try:
            self.disease_service = DiseaseDetectionService()
            logger.info("Pest prediction service initialized")
        except Exception as e:
            logger.warning(f"Pest service degraded - disease service unavailable: {str(e)}")
            self.disease_service = None
    
    def get_control_recommendations(self, image_bytes: bytes) -> Dict:
        """
        Get pest/disease control recommendations from image
        
        Args:
            image_bytes: Image file bytes
            
        Returns:
            Dictionary containing disease info and control measures
        """
        try:
            # First detect the disease
            disease_result = self.disease_service.predict_disease(image_bytes)
            
            disease_name = disease_result["disease"]
            
            # Normalize disease name for lookup
            disease_key = self._normalize_disease_name(disease_name)
            
            # Get control measures
            control_data = self._get_control_measures(disease_key)
            
            return {
                "disease": disease_name,
                "confidence": disease_result["confidence"],
                "severity": control_data["severity"],
                "control_measures": control_data["organic"] + control_data["chemical"][:2],
                "organic_solutions": control_data["organic"],
                "chemical_solutions": control_data["chemical"],
                "preventive_measures": control_data["preventive"],
                "estimated_recovery_time": control_data["recovery_time"]
            }
            
        except Exception as e:
            logger.error(f"Pest control recommendation error: {str(e)}")
            raise ValueError(f"Failed to get control recommendations: {str(e)}")
    
    def _normalize_disease_name(self, disease_name: str) -> str:
        """Normalize disease name for database lookup"""
        disease_lower = disease_name.lower()
        
        # Check for key disease patterns
        if "early" in disease_lower and "blight" in disease_lower:
            return "Early_blight"
        elif "late" in disease_lower and "blight" in disease_lower:
            return "Late_blight"
        elif "blast" in disease_lower:
            return "Leaf_Blast"
        elif "brown" in disease_lower and "spot" in disease_lower:
            return "Brown_Spot"
        elif "bacterial" in disease_lower and "spot" in disease_lower:
            return "Bacterial_spot"
        elif "healthy" in disease_lower:
            return "healthy"
        
        # Default to generic recommendations
        return "default"
    
    def _get_control_measures(self, disease_key: str) -> Dict:
        """Get control measures for disease"""
        if disease_key in self.CONTROL_MEASURES:
            return self.CONTROL_MEASURES[disease_key]
        
        # Default generic recommendations
        return {
            "organic": [
                "Remove and destroy infected plant parts",
                "Improve air circulation around plants",
                "Apply neem oil or other organic fungicides",
                "Maintain proper plant nutrition"
            ],
            "chemical": [
                "Consult local agricultural extension for appropriate fungicides",
                "Follow label instructions carefully",
                "Apply preventive sprays during disease-prone periods"
            ],
            "preventive": [
                "Practice crop rotation",
                "Use disease-resistant varieties",
                "Maintain field sanitation",
                "Monitor plants regularly for early detection"
            ],
            "severity": "Medium",
            "recovery_time": "2-4 weeks with proper management"
        }
    
    def get_active_alerts(self) -> List[Dict]:
        """Get active pest and disease alerts"""
        return [
            {
                "alert_type": "Disease Alert",
                "pest_disease": "Late Blight",
                "affected_crops": ["Potato", "Tomato"],
                "regions": ["Punjab", "Haryana", "UP"],
                "severity": "High",
                "recommendation": "Apply preventive fungicides immediately"
            },
            {
                "alert_type": "Pest Alert",
                "pest_disease": "Fall Armyworm",
                "affected_crops": ["Maize", "Sorghum"],
                "regions": ["Karnataka", "Maharashtra"],
                "severity": "Medium",
                "recommendation": "Monitor fields regularly and apply IPM practices"
            },
            {
                "alert_type": "Weather Alert",
                "pest_disease": "Fungal Diseases",
                "affected_crops": ["All crops"],
                "regions": ["Coastal regions"],
                "severity": "Medium",
                "recommendation": "High humidity conditions favor fungal diseases"
            }
        ]