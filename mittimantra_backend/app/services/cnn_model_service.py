import httpx
import base64
import logging
import json

logger = logging.getLogger(__name__)

HF_SPACE_BASE = "https://tyagisurya001-mitti-mantra.hf.space"

async def predict(image_bytes: bytes) -> tuple[str, float]:
    logger.info("[INFO] Sending image to HF Space for inference...")
    
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            # Step 1: Upload image file to get a path
            upload_response = await client.post(
                f"{HF_SPACE_BASE}/gradio_api/upload",
                files={"files": ("image.jpg", image_bytes, "image/jpeg")}
            )
            upload_response.raise_for_status()
            uploaded_path = upload_response.json()[0]
            logger.info(f"[INFO] Uploaded file path: {uploaded_path}")

            # Step 2: Submit prediction job
            payload = {
                "data": [{"path": uploaded_path, "orig_name": "image.jpg", 
                          "mime_type": "image/jpeg", "meta": {"_type": "gradio.FileData"}}]
            }
            response = await client.post(
                f"{HF_SPACE_BASE}/gradio_api/call/predict", json=payload
            )
            response.raise_for_status()
            event_id = response.json()["event_id"]
            logger.info(f"[INFO] Got event_id: {event_id}")

            # Step 3: Get result via SSE
            result_response = await client.get(
                f"{HF_SPACE_BASE}/gradio_api/call/predict/{event_id}"
            )
            result_response.raise_for_status()
            logger.info(f"[INFO] Raw SSE response: {result_response.text}")

            # Parse SSE
            lines = result_response.text.strip().split("\n")
            result_data = None
            for line in lines:
                line = line.strip()
                if line.startswith("data:"):
                    content = line[5:].strip()
                    try:
                        parsed = json.loads(content)
                        if isinstance(parsed, list) and len(parsed) > 0:
                            result_data = parsed[0]
                            break
                    except:
                        continue

            if result_data is None:
                raise RuntimeError(f"Could not parse SSE response: {result_response.text}")

            logger.info(f"[INFO] Result data: {result_data}")
            return result_data["disease"], result_data["confidence"]

    except httpx.TimeoutException:
        raise RuntimeError("HF Space timed out. Please try again.")
    except RuntimeError:
        raise
    except Exception as exc:
        raise RuntimeError(f"HF Space inference failed: {exc}")
