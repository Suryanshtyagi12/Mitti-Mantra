# app/utils/image_utils.py
"""
Image Processing Utilities
"""

try:
    from PIL import Image
except ImportError:
    Image = None

import numpy as np
import io
import logging

logger = logging.getLogger(__name__)


def preprocess_image(image_bytes: bytes, target_size: tuple) -> np.ndarray:
    """
    Preprocess image for model prediction
    
    Args:
        image_bytes: Raw image bytes
        target_size: Target size as (height, width)
        
    Returns:
        Preprocessed image as numpy array
    """
    try:
        # Open image from bytes
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize to target size
        image = image.resize(target_size, Image.Resampling.LANCZOS)
        
        # Convert to numpy array
        image_array = np.array(image)
        
        # Normalize pixel values to [0, 1]
        image_array = image_array.astype('float32') / 255.0
        
        return image_array
        
    except Exception as e:
        logger.error(f"Image preprocessing error: {str(e)}")
        raise ValueError(f"Failed to preprocess image: {str(e)}")


def validate_image(image_bytes: bytes) -> bool:
    """
    Validate if the uploaded file is a valid image
    
    Args:
        image_bytes: Raw image bytes
        
    Returns:
        True if valid image, False otherwise
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        image.verify()
        return True
    except Exception:
        return False


def get_image_info(image_bytes: bytes) -> dict:
    """
    Get information about the image
    
    Args:
        image_bytes: Raw image bytes
        
    Returns:
        Dictionary containing image information
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        return {
            "format": image.format,
            "mode": image.mode,
            "size": image.size,
            "width": image.width,
            "height": image.height
        }
    except Exception as e:
        logger.error(f"Failed to get image info: {str(e)}")
        return {}