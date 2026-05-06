"""
Gemini Vision Client — uses the new `google-genai` SDK (google-genai >= 1.0).

Model fallback chain (tried in order):
  1. gemini-2.0-flash         — default, fastest, high quota
  2. gemini-1.5-flash         — stable with generous free quota
  3. gemini-1.5-flash-8b      — lightest model, separate quota pool
  4. gemini-2.5-flash-lite    — preview model, additional quota pool
  5. gemini-2.0-flash-lite    — lite variant
  6. gemini-2.0-flash-001     — pinned stable version

On 429 (quota exhausted) the next model is tried automatically.
On 503 (overloaded) the next model is tried after a short pause.
"""

import os
import time
import logging
from io import BytesIO

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

try:
    from google import genai
    from google.genai import types as genai_types
    from google.genai import errors as genai_errors
    _SDK_AVAILABLE = True
except ImportError:
    genai = None
    genai_types = None
    genai_errors = None
    _SDK_AVAILABLE = False
    logger.warning("google-genai SDK not installed. Run: pip install google-genai")

# ── Model fallback chain ────────────────────────────────────────────────────
# Models are tried in order; 429/503 triggers the next one.
# Priority: fastest/most-capable first, then fallback to lighter free-tier models
FALLBACK_MODELS = [
    "gemini-2.0-flash",        # 1st choice — fastest, high quota limit
    "gemini-1.5-flash",        # 2nd choice — very stable, generous free tier
    "gemini-1.5-flash-8b",     # 3rd choice — lightest, separate quota pool
    "gemini-2.5-flash-lite",   # 4th choice — preview, additional pool
    "gemini-2.0-flash-lite",   # 5th choice — lite variant
    "gemini-2.0-flash-001",    # 6th choice — pinned stable version
]


class GeminiVisionClient:
    """
    Thin wrapper around the new Google GenAI SDK for vision/image tasks.
    Automatically falls back through FALLBACK_MODELS on quota/load errors.

    Usage:
        client = GeminiVisionClient()
        result = client.get_vision_completion(prompt, pil_image)
    """

    def __init__(self):
        self._client = None
        api_key = os.getenv("GEMINI_API_KEY", "").strip()

        if not api_key:
            logger.error("GEMINI_API_KEY is missing from environment variables.")
            return

        if not _SDK_AVAILABLE:
            logger.error("google-genai SDK is not installed. Run: pip install google-genai")
            return

        try:
            self._client = genai.Client(api_key=api_key)
            logger.info(
                "GeminiVisionClient initialised. Fallback chain: %s",
                " -> ".join(FALLBACK_MODELS),
            )
        except Exception as exc:
            logger.error("Failed to initialise Gemini client: %s", exc)

    # ── Public API ──────────────────────────────────────────────────────────

    def get_vision_completion(
        self,
        prompt: str,
        image,                        # PIL.Image or raw bytes
        system_instruction: str | None = None,
    ) -> str:
        """
        Send an image + text prompt to Gemini and return the text response.
        Automatically retries with fallback models on 429 / 503 errors.

        Returns
        -------
        str  — Gemini's text response.
             — Starts with "Error:" if all models fail.
        """
        if self._client is None:
            return (
                "Error: Gemini client is not initialised. "
                "Check GEMINI_API_KEY and google-genai installation."
            )

        # Build full prompt (prepend system instruction if provided)
        full_prompt = f"{system_instruction}\n\n{prompt}" if system_instruction else prompt

        # Convert image once — reused across all model attempts
        try:
            image_part = self._to_image_part(image)
        except Exception as exc:
            logger.error("Image conversion failed: %s", exc, exc_info=True)
            return f"Error: Could not process image — {exc}"

        last_error = None
        tried_models = []

        for model_name in FALLBACK_MODELS:
            tried_models.append(model_name)
            try:
                logger.info(
                    "Trying Gemini model: %s (attempt %d/%d)",
                    model_name, len(tried_models), len(FALLBACK_MODELS)
                )

                response = self._client.models.generate_content(
                    model=model_name,
                    contents=[full_prompt, image_part],
                )

                text = response.text
                if not text or not text.strip():
                    logger.warning("Model %s returned empty response. Trying next.", model_name)
                    continue

                logger.info(
                    "✅ Gemini success with model=%s (response_length=%d chars)",
                    model_name, len(text)
                )
                return text

            except Exception as exc:
                last_error = exc
                err_str = str(exc)

                # 429 → quota exhausted; try next model immediately
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    logger.warning(
                        "⚠️  Model %s quota exhausted (429). Switching to next model.", model_name
                    )
                    continue  # try next

                # 503 → server overloaded; short pause then try next
                if "503" in err_str or "UNAVAILABLE" in err_str:
                    logger.warning(
                        "⚠️  Model %s overloaded (503). Pausing 2s then trying next.", model_name
                    )
                    time.sleep(2)
                    continue

                # 404 → model not found in this API key's project
                if "404" in err_str or "NOT_FOUND" in err_str:
                    logger.warning("Model %s not found (404). Skipping.", model_name)
                    continue

                # 400 → bad request (invalid model, bad image format, etc.)
                if "400" in err_str or "INVALID_ARGUMENT" in err_str:
                    logger.warning("Model %s bad request (400): %s. Skipping.", model_name, err_str[:200])
                    continue

                # Any other error — log fully and try next model
                logger.error(
                    "Gemini error with model=%s: %s", model_name, exc, exc_info=True
                )
                continue

        # All models exhausted
        logger.error(
            "❌ All %d Gemini models failed. Tried: %s. Last error: %s",
            len(FALLBACK_MODELS), ", ".join(tried_models), last_error
        )
        return f"Error: All Gemini models failed. Last error: {last_error}"

    # ── Private helpers ─────────────────────────────────────────────────────

    def _to_image_part(self, image):
        """Convert a PIL.Image or raw bytes into a genai-compatible Part object."""
        if not _SDK_AVAILABLE:
            raise RuntimeError("google-genai SDK not available")

        # Already a genai Part
        if isinstance(image, genai_types.Part):
            return image

        # PIL Image → JPEG bytes
        try:
            from PIL import Image as PILImage
            if isinstance(image, PILImage.Image):
                # Convert palette/RGBA modes that can't be saved as JPEG
                if image.mode not in ("RGB", "L"):
                    image = image.convert("RGB")
                buf = BytesIO()
                image.save(buf, format="JPEG", quality=90)
                return genai_types.Part.from_bytes(
                    data=buf.getvalue(), mime_type="image/jpeg"
                )
        except ImportError:
            pass

        # Raw bytes → detect mime type or default to JPEG
        if isinstance(image, (bytes, bytearray)):
            raw = bytes(image)
            # Basic magic-byte detection
            if raw[:4] == b"RIFF":
                mime = "image/webp"
            elif raw[:8] == b"\x89PNG\r\n\x1a\n":
                mime = "image/png"
            elif raw[:2] in (b"\xff\xd8", b"\xff\xe0", b"\xff\xe1"):
                mime = "image/jpeg"
            else:
                mime = "image/jpeg"   # default
            return genai_types.Part.from_bytes(data=raw, mime_type=mime)

        raise TypeError(f"Unsupported image type: {type(image)}")


# Module-level singleton — instantiated once at import time
gemini_vision_client = GeminiVisionClient()
