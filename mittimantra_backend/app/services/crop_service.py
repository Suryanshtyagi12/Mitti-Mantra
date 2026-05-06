# app/services/crop_service.py
"""
Crop Recommendation Service
Handles crop prediction using ML model loaded from Hugging Face Hub
"""

import joblib
import numpy as np
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Built-in label map for the standard 22-class Crop Recommendation dataset.
# Used when crop_label_encoder.pkl is not present in the Hugging Face repo.
# ---------------------------------------------------------------------------
CROP_LABEL_MAP = {
    0: "apple",      1: "banana",    2: "blackgram",  3: "chickpea",
    4: "coconut",    5: "coffee",    6: "cotton",     7: "grapes",
    8: "jute",       9: "kidneybeans", 10: "lentil",  11: "maize",
    12: "mango",     13: "mothbeans", 14: "mungbean", 15: "muskmelon",
    16: "orange",    17: "papaya",   18: "pigeonpeas", 19: "pomegranate",
    20: "rice",      21: "watermelon",
}

# ---------------------------------------------------------------------------
# Lazy-loading singleton — model is downloaded once from Hugging Face Hub
# and reused for every subsequent request.
# ---------------------------------------------------------------------------
_crop_model = None
_crop_label_encoder = None


def _load_crop_model():
    """Download and cache the crop recommendation model from Hugging Face Hub."""
    global _crop_model, _crop_label_encoder

    if _crop_model is not None:
        return _crop_model, _crop_label_encoder

    try:
        from huggingface_hub import hf_hub_download

        logger.info("Downloading crop model from Hugging Face Hub …")
        model_path = hf_hub_download(
            repo_id="tyagisurya001/crop-recommendation-ml",
            filename="crop_model.pkl"
        )
        _crop_model = joblib.load(model_path)
        logger.info("crop_model.pkl loaded successfully from Hugging Face Hub")

        # Try to fetch a label encoder if one exists in the same repo
        try:
            encoder_path = hf_hub_download(
                repo_id="tyagisurya001/crop-recommendation-ml",
                filename="crop_label_encoder.pkl"
            )
            _crop_label_encoder = joblib.load(encoder_path)
            logger.info("crop_label_encoder.pkl loaded successfully from Hugging Face Hub")
        except Exception as enc_err:
            logger.warning(
                f"Label encoder not found in HF repo ({enc_err}). "
                "Using built-in CROP_LABEL_MAP instead."
            )
            _crop_label_encoder = None

    except Exception as e:
        logger.error(f"Failed to load crop model from Hugging Face Hub: {e}")
        _crop_model = None
        _crop_label_encoder = None

    return _crop_model, _crop_label_encoder


class CropRecommendationService:
    """Service for crop recommendation"""

    def __init__(self):
        """Trigger model download eagerly at service startup."""
        self.model, self.label_encoder = _load_crop_model()

    def predict_crop(
        self,
        nitrogen: float,
        phosphorus: float,
        potassium: float,
        temperature: float,
        humidity: float,
        ph: float,
        rainfall: float
    ) -> Dict:
        """
        Predict optimal crop based on soil and environmental conditions.

        Args:
            nitrogen: Nitrogen content in soil
            phosphorus: Phosphorus content in soil
            potassium: Potassium content in soil
            temperature: Temperature in Celsius
            humidity: Relative humidity percentage
            ph: Soil pH value
            rainfall: Rainfall in mm

        Returns:
            Dictionary containing recommended crop and additional information
        """
        # Ensure model is available (re-try download if first attempt failed)
        model, label_encoder = _load_crop_model()

        if model is None:
            logger.warning("Crop model unavailable; using rule-based fallback.")
            return self._get_fallback_prediction(
                nitrogen, phosphorus, potassium,
                temperature, humidity, ph, rainfall
            )

        try:
            # Prepare input features
            features = np.array([[
                nitrogen, phosphorus, potassium,
                temperature, humidity, ph, rainfall
            ]])

            # Make prediction — the Pipeline already decodes labels to strings.
            prediction = model.predict(features)

            # Get prediction probabilities if available
            confidence = None
            alternative_crops = None

            if hasattr(model, 'predict_proba'):
                probabilities = model.predict_proba(features)[0]
                confidence = float(np.max(probabilities))

                # top_indices are positional (0-based) indices into the
                # probability array / classes_ list — NOT class labels.
                top_indices = np.argsort(probabilities)[-3:][::-1]

                # Resolve class names using positional lookup
                if label_encoder is not None and hasattr(label_encoder, 'classes_'):
                    # classes_ is sorted alphabetically; index matches proba column
                    alternative_crops = [
                        str(label_encoder.classes_[int(idx)])
                        for idx in top_indices[1:]
                    ]
                else:
                    # Fallback to built-in CROP_LABEL_MAP
                    alternative_crops = [
                        CROP_LABEL_MAP.get(int(idx), str(idx))
                        for idx in top_indices[1:]
                    ]

            # prediction[0] is already a decoded string label (e.g. 'rice')
            recommended_crop = str(prediction[0])

            # Generate reasoning
            reasoning = self._generate_reasoning(
                recommended_crop, nitrogen, phosphorus, potassium,
                temperature, humidity, ph, rainfall
            )

            return {
                "recommended_crop": recommended_crop,
                "confidence": confidence,
                "alternative_crops": alternative_crops,
                "reasoning": reasoning
            }

        except Exception as e:
            logger.error(f"Crop prediction error: {e}")
            return self._get_fallback_prediction(
                nitrogen, phosphorus, potassium,
                temperature, humidity, ph, rainfall
            )

    def _get_fallback_prediction(
        self, n, p, k, temp, humidity, ph, rainfall
    ) -> Dict:
        """Rule-based fallback when ML model is unavailable"""
        logger.info("Using rule-based fallback for crop prediction")

        recommended_crop = "Rice"  # Default

        # Temperature based
        if temp < 20:
            recommended_crop = "Wheat"
        elif temp > 30:
            recommended_crop = "Pigeonpeas"

        # Rainfall adjustments
        if rainfall < 50:
            recommended_crop = "Mothbeans" if temp > 25 else "Chickpea"
        elif rainfall > 200:
            recommended_crop = "Rice" if temp > 20 else "Jute"

        # Soil / Nutrient adjustments
        if n > 120:
            recommended_crop = "Cotton"
        if ph < 5.5:
            recommended_crop = "Tea" if rainfall > 150 else "Potato"

        reasoning = (
            f"Based on temperature ({temp}°C) and rainfall ({rainfall}mm). "
            "(Rule-based Fallback)"
        )

        return {
            "recommended_crop": recommended_crop,
            "confidence": 0.85,
            "alternative_crops": ["Maize", "Lentil"],
            "reasoning": reasoning
        }

    def _generate_reasoning(
        self, crop: str, n: float, p: float, k: float,
        temp: float, humidity: float, ph: float, rainfall: float
    ) -> str:
        """Generate human-readable reasoning for the recommendation"""
        reasons = []

        if temp < 15:
            reasons.append("Cool temperature suitable for cold-season crops")
        elif temp > 30:
            reasons.append("High temperature favorable for heat-tolerant crops")

        if rainfall > 200:
            reasons.append("High rainfall supports water-intensive crops")
        elif rainfall < 50:
            reasons.append("Low rainfall requires drought-resistant crops")

        if ph < 6:
            reasons.append("Acidic soil conditions")
        elif ph > 7.5:
            reasons.append("Alkaline soil conditions")

        npk_ratio = f"N:P:K ratio of {n:.0f}:{p:.0f}:{k:.0f}"
        reasons.append(npk_ratio)

        return f"{crop.capitalize()} is recommended based on: " + ", ".join(reasons)

    def get_crop_patterns(self) -> List[Dict]:
        """Get historical crop pattern data"""
        return [
            {"season": "Kharif", "popular_crops": ["rice", "maize", "cotton"], "success_rate": 85},
            {"season": "Rabi", "popular_crops": ["wheat", "mustard", "chickpea"], "success_rate": 88},
            {"season": "Zaid", "popular_crops": ["watermelon", "cucumber", "muskmelon"], "success_rate": 80}
        ]

    def get_seasonal_recommendations(self) -> Dict:
        """Get seasonal crop recommendations"""
        return {
            "current_season": "Kharif",
            "recommended_crops": ["rice", "maize", "soybean", "cotton"],
            "market_prices": {
                "rice": "₹2000-2500/quintal",
                "maize": "₹1800-2200/quintal",
                "soybean": "₹4000-4500/quintal"
            }
        }