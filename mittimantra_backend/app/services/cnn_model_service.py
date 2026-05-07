import os
import json
import logging
import numpy as np
from io import BytesIO
from PIL import Image

# Import tensorflow cleanly, silencing some warnings if possible
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
import tensorflow as tf

from huggingface_hub import hf_hub_download

logger = logging.getLogger(__name__)

class CNNModelService:
    """Service to load and predict using the CNN model from Hugging Face."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(CNNModelService, cls).__new__(cls)
            cls._instance.model = None
            cls._instance.labels = None
            cls._instance.repo_id = os.getenv("HF_MODEL_REPO", "tyagisurya001/plant-disease-detector")
            cls._instance.config_filename = os.getenv("HF_MODEL_CONFIG", "config.json")
            cls._instance.weights_filename = os.getenv("HF_MODEL_WEIGHTS", "model.weights.h5")
            cls._instance.metadata_filename = os.getenv("HF_MODEL_METADATA", "metadata.json")
        return cls._instance

    def _initialize_model(self):
        """Download and initialize the model from Hugging Face."""
        try:
            logger.info(f"Downloading CNN model files from HF repo: {self.repo_id}...")

            # 1. Download config.json
            config_path = hf_hub_download(repo_id=self.repo_id, filename=self.config_filename)
            with open(config_path, "r") as f:
                config_data = f.read()

            # Reconstruct architecture
            self.model = tf.keras.models.model_from_json(config_data)
            logger.info("CNN architecture reconstructed successfully.")

            # 2. Download and load weights
            weights_path = hf_hub_download(repo_id=self.repo_id, filename=self.weights_filename)
            self.model.load_weights(weights_path)
            logger.info("CNN weights loaded successfully.")

            # 3. Try to download metadata.json for labels
            try:
                metadata_path = hf_hub_download(repo_id=self.repo_id, filename=self.metadata_filename)
                with open(metadata_path, "r") as f:
                    metadata = json.load(f)
                    # Support different metadata structures, assume it has a "labels" or "classes" list
                    self.labels = metadata.get("labels", metadata.get("classes", None))
                    if isinstance(self.labels, dict):
                        # if it's a dict { "0": "Apple_scab", "1": ... } convert to list
                        self.labels = [self.labels[str(i)] for i in range(len(self.labels))]
                logger.info(f"CNN labels loaded from {self.metadata_filename}.")
            except Exception as e:
                logger.warning(f"{self.metadata_filename} not found or could not be parsed: {e}")
                self.labels = None

            logger.info("CNN model cached successfully.")

        except Exception as e:
            logger.error(f"Failed to load CNN model: {e}")
            self.model = None
            self.labels = None

    def predict(self, image_bytes: bytes) -> tuple[str, float]:
        """
        Predict the disease from image bytes.
        Returns:
            disease_name (str), confidence (float)
        """
        if self.model is None:
            logger.info("Lazy-loading CNN model")
            self._initialize_model()

        if self.model is None:
            raise RuntimeError("CNN Model loading failed. Please verify Hugging Face repo and files.")

        try:
            # Load image
            img = Image.open(BytesIO(image_bytes))
            
            # Preprocess image
            # Assume 224x224 input size, which is standard for MobileNet/ResNet
            input_shape = self.model.input_shape
            target_size = (224, 224)
            if input_shape and len(input_shape) >= 3 and input_shape[1] is not None and input_shape[2] is not None:
                target_size = (input_shape[1], input_shape[2])

            img = img.resize(target_size)
            img_array = tf.keras.preprocessing.image.img_to_array(img)
            
            # Expand dimensions to create batch size of 1
            img_array = np.expand_dims(img_array, axis=0)

            # Normalize (assuming [0, 1] scaling is common, though some models use [-1, 1] or ImageNet means)
            # If the model has a Rescaling layer built-in, this might be redundant.
            # But standard Keras practice without built-in preprocessing layer often uses /255.0
            # For safety, we check if max value > 1, then scale.
            if img_array.max() > 1.0:
                img_array = img_array / 255.0

            # Predict
            predictions = self.model.predict(img_array, verbose=0)
            confidence = float(np.max(predictions[0]))
            class_idx = int(np.argmax(predictions[0]))

            # Resolve label
            disease_name = "Unknown Disease"
            if self.labels and class_idx < len(self.labels):
                disease_name = self.labels[class_idx]
            else:
                disease_name = f"Class_{class_idx}"

            return disease_name, confidence

        except Exception as e:
            err_msg = str(e)
            logger.error(f"CNN prediction failed: {err_msg}")
            low = err_msg.lower()
            if "cannot identify image file" in low or "cannot identify" in low:
                raise RuntimeError(
                    "Invalid image file: the uploaded file could not be read as an image. "
                    "Please upload a valid JPG, PNG, or WEBP file."
                )
            elif "out of memory" in low or "oom" in low:
                raise RuntimeError(
                    "TensorFlow inference failed: insufficient memory. "
                    "Try uploading a smaller image."
                )
            else:
                raise RuntimeError(f"TensorFlow inference failed: {err_msg}")

# Instantiate the singleton
cnn_model_service = CNNModelService()
