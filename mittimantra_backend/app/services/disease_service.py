"""
Plant Disease Detection Service
Provides utility helpers for disease detection.
Actual image analysis is performed by Gemini Vision (via DiseaseAIService).
The heavy LLaVA-v1.5-7B model has been removed — it is ~14 GB and not
suitable for production deployment.
"""

import logging
from typing import Dict, List, Tuple

logger = logging.getLogger(__name__)


class DiseaseDetectionService:
    """
    Lightweight disease detection utility service.

    Image-based detection is handled entirely by Gemini Vision API
    (see DiseaseAIService).  This class retains helper methods that are
    reused across the codebase (severity classification, common-disease
    lookup, etc.).
    """

    # ------------------------------------------------------------------
    # Public helpers
    # ------------------------------------------------------------------

    def get_severity_from_label(self, disease: str, confidence: float = 0.85) -> str:
        """Classify severity from a disease name and confidence score."""
        if not disease or "healthy" in disease.lower():
            return "None"
        if confidence > 0.8 and any(
            k in disease.lower() for k in ["blight", "rot", "blast", "scab"]
        ):
            return "High"
        if confidence > 0.5:
            return "Medium"
        return "Low"

    def get_common_diseases(self) -> List[Dict]:
        """Return a static catalogue of common plant diseases by season."""
        return [
            {
                "season": "Monsoon",
                "diseases": ["Late Blight", "Leaf Blast", "Brown Spot", "Bacterial Spot"],
                "affected_crops": ["Potato", "Tomato", "Rice", "Pepper"],
            },
            {
                "season": "Winter",
                "diseases": ["Powdery Mildew", "Rust", "Apple Scab"],
                "affected_crops": ["Wheat", "Squash", "Apple", "Cherry"],
            },
            {
                "season": "Summer",
                "diseases": ["Early Blight", "Leaf Curl", "Spider Mites", "Leaf Scorch"],
                "affected_crops": ["Tomato", "Cucumber", "Beans", "Strawberry"],
            },
        ]