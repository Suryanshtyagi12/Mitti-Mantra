import sys
import os

# Add backend to path
sys.path.append("d:/Mittimantra-main/mittimantra_backend")

print("Checking imports...")

try:
    from app.db_models import User, FarmingAdvice, TrackFarming
    print("✅ db_models imported successfully")
except Exception as e:
    print(f"❌ db_models import failed: {e}")

try:
    from app.ai_core.llm_groq_client import GroqClient
    from app.ai_core.llm_gemini_vision_client import GeminiVisionClient
    print("✅ ai_core clients imported successfully")
except Exception as e:
    print(f"❌ ai_core clients import failed: {e}")

try:
    from app.services.ai_orchestrator import ai_orchestrator
    print("✅ ai_orchestrator imported successfully")
except Exception as e:
    print(f"❌ ai_orchestrator import failed: {e}")

try:
    from app.services.track_farming_service import track_farming_service
    print("✅ track_farming_service imported successfully")
except Exception as e:
    print(f"❌ track_farming_service import failed: {e}")

try:
    from app.services.crop_ai_service import crop_ai_service
    print("✅ crop_ai_service imported successfully")
except Exception as e:
    print(f"❌ crop_ai_service import failed: {e}")

try:
    from app.services.irrigation_ai_service import irrigation_ai_service
    print("✅ irrigation_ai_service imported successfully")
except Exception as e:
    print(f"❌ irrigation_ai_service import failed: {e}")

try:
    from app.services.disease_ai_service import disease_ai_service
    print("✅ disease_ai_service imported successfully")
except Exception as e:
    print(f"❌ disease_ai_service import failed: {e}")
    
try:
    from app.services.smart_talk_service import smart_talk_service
    print("✅ smart_talk_service imported successfully")
except Exception as e:
    print(f"❌ smart_talk_service import failed: {e}")

print("\nVerification Complete.")
