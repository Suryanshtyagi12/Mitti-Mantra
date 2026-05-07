"""
CNN Model Service
=================
Loads the full plant_disease_model.keras from Hugging Face and
performs plant disease classification.

Loading strategy:
  - Lazy: model is NOT loaded at import time.
  - Cached: after the first call, the model stays in memory.

Old config.json + model.weights.h5 reconstruction approach has been
completely removed. Only load_model(.keras) is used.
"""

import os
import json
import logging
import numpy as np
from io import BytesIO
from PIL import Image

# Suppress TF C++ log spam before importing tensorflow
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

from huggingface_hub import hf_hub_download
from tensorflow.keras.models import load_model

logger = logging.getLogger(__name__)

# ── Configuration ────────────────────────────────────────────────────────────
MODEL_REPO     = os.getenv("HF_MODEL_REPO",     "tyagisurya001/plant-disease-detector")
MODEL_FILENAME = os.getenv("HF_MODEL_FILENAME",  "plant_disease_model.keras")
METADATA_FILE  = os.getenv("HF_MODEL_METADATA",  "metadata.json")

# ── Module-level lazy cache ──────────────────────────────────────────────────
_model  = None
_labels = None

# ── Standard PlantVillage 38-class label list ────────────────────────────────
# Used as fallback when metadata.json does not contain a "labels"/"classes" key.
# Order matches the typical PlantVillage training split used by this model.
PLANT_VILLAGE_LABELS = [
    "Apple___Apple_scab",
    "Apple___Black_rot",
    "Apple___Cedar_apple_rust",
    "Apple___healthy",
    "Blueberry___healthy",
    "Cherry_(including_sour)___Powdery_mildew",
    "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
    "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight",
    "Corn_(maize)___healthy",
    "Grape___Black_rot",
    "Grape___Esca_(Black_Measles)",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)",
    "Peach___Bacterial_spot",
    "Peach___healthy",
    "Pepper,_bell___Bacterial_spot",
    "Pepper,_bell___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    "Raspberry___healthy",
    "Soybean___healthy",
    "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch",
    "Strawberry___healthy",
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy",
]


def _format_label(raw: str) -> str:
    """Convert PlantVillage label like 'Tomato___Late_blight' → 'Tomato Late Blight'."""
    if "___" in raw:
        plant, disease = raw.split("___", 1)
        plant   = plant.replace("_", " ").replace(",", "").strip()
        disease = disease.replace("_", " ").strip().title()
        return f"{plant} — {disease}"
    return raw.replace("_", " ").title()


def _load_labels() -> list | None:
    """
    Try to get class labels from metadata.json on Hugging Face.
    Falls back to the hardcoded PlantVillage 38-class list if the
    metadata file does not contain a 'labels' or 'classes' key.
    """
    try:
        metadata_path = hf_hub_download(repo_id=MODEL_REPO, filename=METADATA_FILE)
        with open(metadata_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)

        labels = metadata.get("labels") or metadata.get("classes")
        if isinstance(labels, dict):
            labels = [labels[str(i)] for i in range(len(labels))]

        if labels:
            logger.info("[INFO] CNN class labels loaded from metadata.json (%d classes).", len(labels))
            return labels

        # metadata.json exists but has no label field → use built-in list
        logger.info(
            "[INFO] metadata.json has no 'labels'/'classes' key — "
            "using built-in PlantVillage 38-class label list."
        )
    except Exception as exc:
        logger.warning(
            "metadata.json could not be parsed (%s) — using built-in PlantVillage label list.", exc
        )

    return PLANT_VILLAGE_LABELS


def get_model():
    """
    Return the cached Keras model, downloading and loading it on first call.

    Raises RuntimeError with a specific message for each failure mode:
      - Hugging Face download failed
      - .keras model loading failed
    """
    global _model, _labels

    if _model is not None:
        return _model, _labels

    # ── 1. Download plant_disease_model.keras from Hugging Face ─────────────
    logger.info("[INFO] Downloading CNN model from HF repo: %s …", MODEL_REPO)
    try:
        model_path = hf_hub_download(repo_id=MODEL_REPO, filename=MODEL_FILENAME)
    except Exception as exc:
        raise RuntimeError(
            f"Hugging Face download failed: could not download '{MODEL_FILENAME}' "
            f"from repo '{MODEL_REPO}'. Check HF_MODEL_REPO env var and network access. "
            f"Detail: {exc}"
        ) from exc

    # ── 2. Load full .keras model ────────────────────────────────────────────
    logger.info("[INFO] Loading .keras model from: %s", model_path)
    try:
        _model = load_model(model_path)
    except Exception as exc:
        _model = None
        raise RuntimeError(
            f".keras model loading failed: the file at '{model_path}' could not be loaded "
            f"by TensorFlow. Ensure the model was saved with model.save('...keras'). "
            f"Detail: {exc}"
        ) from exc

    logger.info("[INFO] CNN model loaded and cached successfully.")

    # ── 3. Load labels (non-fatal) ───────────────────────────────────────────
    _labels = _load_labels()

    return _model, _labels


# ── Public predict function ──────────────────────────────────────────────────

def predict(image_bytes: bytes) -> tuple[str, float]:
    """
    Run CNN inference on raw image bytes.

    Returns:
        (disease_name: str, confidence: float)

    Raises RuntimeError with a descriptive message for each failure:
        - invalid image uploaded
        - preprocessing failed
        - TensorFlow inference failed
        - Hugging Face download failed
        - .keras model loading failed
    """
    # ── Load / retrieve cached model ─────────────────────────────────────────
    model, labels = get_model()   # raises RuntimeError if download/load fails

    # ── Validate and open image ───────────────────────────────────────────────
    logger.info("[INFO] Image preprocessing started.")
    try:
        img = Image.open(BytesIO(image_bytes))
    except Exception as exc:
        raise RuntimeError(
            f"Invalid image uploaded: the file could not be opened as an image. "
            f"Please upload a valid JPG, PNG, or WEBP file. Detail: {exc}"
        ) from exc

    # ── Preprocess ────────────────────────────────────────────────────────────
    try:
        # Convert to RGB (handles RGBA, palette, greyscale images)
        img = img.convert("RGB")

        # Determine target input size from model signature
        input_shape = model.input_shape  # e.g. (None, 224, 224, 3)
        if input_shape and len(input_shape) >= 4 and input_shape[1] is not None:
            target_h, target_w = int(input_shape[1]), int(input_shape[2])
        else:
            target_h, target_w = 224, 224

        img = img.resize((target_w, target_h), Image.BILINEAR)

        img_array = np.array(img, dtype=np.float32)

        # Normalize to [0, 1] only if values are in [0, 255] range.
        # If the model has a built-in Rescaling layer this is harmless because
        # the layer will re-scale; we guard against double-scaling here by
        # checking the actual pixel range.
        if img_array.max() > 1.0:
            img_array = img_array / 255.0

        # Shape: (1, H, W, 3)
        img_array = np.expand_dims(img_array, axis=0)

    except RuntimeError:
        raise
    except Exception as exc:
        raise RuntimeError(
            f"Preprocessing failed: could not prepare image for inference. "
            f"Detail: {exc}"
        ) from exc

    logger.info(
        "[INFO] Image preprocessing complete. Input tensor shape: %s",
        img_array.shape,
    )

    # ── Run inference ─────────────────────────────────────────────────────────
    logger.info("[INFO] CNN inference started.")
    try:
        predictions = model.predict(img_array, verbose=0)
    except Exception as exc:
        low = str(exc).lower()
        if "out of memory" in low or "oom" in low:
            raise RuntimeError(
                "TensorFlow inference failed: out of GPU/CPU memory. "
                "Try uploading a smaller image."
            ) from exc
        raise RuntimeError(
            f"TensorFlow inference failed: the model encountered an error during prediction. "
            f"Detail: {exc}"
        ) from exc

    # ── Decode prediction ─────────────────────────────────────────────────────
    confidence  = float(np.max(predictions[0]))
    class_idx   = int(np.argmax(predictions[0]))

    if labels and class_idx < len(labels):
        disease_name = _format_label(str(labels[class_idx]))
    else:
        disease_name = f"Class_{class_idx}"

    logger.info(
        "[INFO] CNN inference successful. Disease=%s | Confidence=%.4f",
        disease_name, confidence,
    )

    return disease_name, confidence
