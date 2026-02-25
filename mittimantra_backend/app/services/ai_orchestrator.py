import logging
from app.ai_core.llm_groq_client import groq_client
from app.ai_core.llm_gemini_vision_client import gemini_vision_client
import PIL.Image
import io

logger = logging.getLogger(__name__)

class AIOrchestrator:
    def get_llm_response(
        self, 
        prompt: str, 
        system_prompt: str = "You are a helpful farming assistant.",
        language: str = "en",
        json_mode: bool = False
    ) -> str:
        """
        Get response from Groq based LLM via AI Core.
        """
        try:
            # Append language instruction to system prompt if not already there
            lang_instruction = " Reply in Hindi." if language == "hi" else " Reply in English."
            full_system_prompt = system_prompt + lang_instruction

            # Use ai_core client
            # Groq client in ai_core doesn't support json_mode explicitly in the wrapper I copied?
            # Let me check llm_groq_client.py content. 
            # I copied it as is. It uses `response_format={"type": "json_object"}`? 
            # No, I copied `d:/crop Ai/utils/llm_groq_client.py` which did NOT have json_mode support in `get_completion`.
            # I will just use text mode for now as per Crop AI source.
            
            return groq_client.get_completion(prompt, system_instruction=full_system_prompt)
        except Exception as e:
            logger.error(f"Error calling Groq via AI Core: {str(e)}")
            return "AI service unavailable."

    def analyze_image(self, image_bytes: bytes, prompt: str, language: str = "en") -> str:
        """
        Analyze image using Gemini via AI Core.
        """
        try:
            # Convert bytes to PIL Image as required by generic Gemini usage, 
            # OR pass bytes if loading method supports it. 
            # ai_core client expects `image_data`.
            
            image = PIL.Image.open(io.BytesIO(image_bytes))
            
            sys_prompt = f"You are an expert agriculture assistant. Reply in {language}."
            return gemini_vision_client.get_vision_completion(prompt, image, system_instruction=sys_prompt)
        except Exception as e:
            logger.error(f"Error calling Gemini via AI Core: {str(e)}")
            return "Image analysis failed."

ai_orchestrator = AIOrchestrator()
