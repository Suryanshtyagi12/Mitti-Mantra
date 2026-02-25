"""
Plant Disease Detection Service
Handles disease detection from leaf images
"""

import numpy as np
import logging
from pathlib import Path
from typing import Dict, List
from app.utils.image_utils import preprocess_image

logger = logging.getLogger(__name__)

try:
    import tensorflow as tf
except ImportError:
    logger.warning("TensorFlow not found. Disease detection service will be unavailable.")
    tf = None


class DiseaseDetectionService:
    """Service for plant disease detection"""
    
    # Common PlantVillage dataset classes (38 classes)
    # Update this list if your model has different classes
    DISEASE_CLASSES = [
        'Apple___Apple_scab',
        'Apple___Black_rot',
        'Apple___Cedar_apple_rust',
        'Apple___healthy',
        'Blueberry___healthy',
        'Cherry_(including_sour)___Powdery_mildew',
        'Cherry_(including_sour)___healthy',
        'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot',
        'Corn_(maize)___Common_rust_',
        'Corn_(maize)___Northern_Leaf_Blight',
        'Corn_(maize)___healthy',
        'Grape___Black_rot',
        'Grape___Esca_(Black_Measles)',
        'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)',
        'Grape___healthy',
        'Orange___Haunglongbing_(Citrus_greening)',
        'Peach___Bacterial_spot',
        'Peach___healthy',
        'Pepper,_bell___Bacterial_spot',
        'Pepper,_bell___healthy',
        'Potato___Early_blight',
        'Potato___Late_blight',
        'Potato___healthy',
        'Raspberry___healthy',
        'Soybean___healthy',
        'Squash___Powdery_mildew',
        'Strawberry___Leaf_scorch',
        'Strawberry___healthy',
        'Tomato___Bacterial_spot',
        'Tomato___Early_blight',
        'Tomato___Late_blight',
        'Tomato___Leaf_Mold',
        'Tomato___Septoria_leaf_spot',
        'Tomato___Spider_mites Two-spotted_spider_mite',
        'Tomato___Target_Spot',
        'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
        'Tomato___Tomato_mosaic_virus',
        'Tomato___healthy'
    ]
    
    def __init__(self):
        """Load disease detection model"""
        try:
            model_path = Path("models/plant_disease_model.keras")
            self.model = tf.keras.models.load_model(model_path)
            self.input_shape = self.model.input_shape[1:3]
            
            # Get number of classes from model
            num_classes = self.model.output_shape[-1]
            
            # Adjust class list if needed
            if num_classes != len(self.DISEASE_CLASSES):
                logger.warning(f"Model has {num_classes} classes but DISEASE_CLASSES has {len(self.DISEASE_CLASSES)}")
                # Use generic names if mismatch
                if num_classes < len(self.DISEASE_CLASSES):
                    self.DISEASE_CLASSES = self.DISEASE_CLASSES[:num_classes]
                else:
                    # Pad with generic names
                    for i in range(len(self.DISEASE_CLASSES), num_classes):
                        self.DISEASE_CLASSES.append(f"Disease_Class_{i}")
            
            logger.info(f"Disease detection model loaded successfully with input shape {self.input_shape}")
            logger.info(f"Number of disease classes: {num_classes}")
        except Exception as e:
            logger.warning(f"Failed to load disease detection model: {str(e)}")
            self.model = None
            self.input_shape = (224, 224)  # Default shape
    
    def predict_disease(self, image_bytes: bytes) -> Dict:
        """
        Predict plant disease from leaf image
        
        Args:
            image_bytes: Image file bytes
            
        Returns:
            Dictionary containing disease name and additional information
        """
        try:
            # Preprocess image
            processed_image = preprocess_image(image_bytes, self.input_shape)
            
            # Add batch dimension
            image_batch = np.expand_dims(processed_image, axis=0)
            
            # Make prediction
            predictions = self.model.predict(image_batch, verbose=0)
            predicted_class = np.argmax(predictions[0])
            confidence = float(predictions[0][predicted_class])
            
            # Safety check
            if predicted_class >= len(self.DISEASE_CLASSES):
                logger.error(f"Predicted class {predicted_class} exceeds available classes {len(self.DISEASE_CLASSES)}")
                raise ValueError(f"Predicted class index out of range")
            
            # Get disease name
            disease_name = self.DISEASE_CLASSES[predicted_class]
            
            # Parse disease name to extract plant and disease
            if '___' in disease_name:
                parts = disease_name.split('___')
                affected_plant = parts[0].replace('_', ' ')
                disease = parts[1].replace('_', ' ') if len(parts) > 1 else "Unknown"
            elif '_' in disease_name and 'Class' in disease_name:
                # Generic class name
                affected_plant = "Plant"
                disease = disease_name
            else:
                affected_plant = "Plant"
                disease = disease_name.replace('_', ' ')
            
            # Determine severity based on confidence and disease type
            severity = self._determine_severity(disease, confidence)
            
            logger.info(f"Disease detected: {disease} (confidence: {confidence:.2f}, severity: {severity})")
            
            return {
                "disease": disease,
                "confidence": confidence,
                "severity": severity,
                "affected_plant": affected_plant
            }
            
        except Exception as e:
            logger.error(f"Disease prediction error: {str(e)}")
            raise ValueError(f"Failed to predict disease: {str(e)}")
    
    def _determine_severity(self, disease: str, confidence: float) -> str:
        """Determine disease severity"""
        if "healthy" in disease.lower():
            return "None"
        elif confidence > 0.8:
            if any(keyword in disease.lower() for keyword in ["blight", "rot", "blast", "scab"]):
                return "High"
            return "Medium"
        return "Low"
    
    def get_common_diseases(self) -> List[Dict]:
        """Get list of common diseases by season"""
        return [
            {
                "season": "Monsoon",
                "diseases": ["Late Blight", "Leaf Blast", "Brown Spot", "Bacterial Spot"],
                "affected_crops": ["Potato", "Tomato", "Rice", "Pepper"]
            },
            {
                "season": "Winter",
                "diseases": ["Powdery Mildew", "Rust", "Apple Scab"],
                "affected_crops": ["Wheat", "Squash", "Apple", "Cherry"]
            },
            {
                "season": "Summer",
                "diseases": ["Early Blight", "Leaf Curl", "Spider Mites", "Leaf Scorch"],
                "affected_crops": ["Tomato", "Cucumber", "Beans", "Strawberry"]
            }
        ]