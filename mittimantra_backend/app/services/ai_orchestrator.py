import logging
from app.ai_core.llm_groq_client import groq_client
from app.ai_core.llm_gemini_vision_client import gemini_vision_client
import PIL.Image
import io

logger = logging.getLogger(__name__)

# Language directive strings
_HINDI_DIRECTIVE = (
    " IMPORTANT: तुम एक भारतीय कृषि विशेषज्ञ हो। "
    "अपना पूरा जवाब सरल हिंदी में दो जो किसान आसानी से समझ सकें। "
    "जटिल तकनीकी शब्दों के लिए हिंदी विकल्प उपयोग करो। "
    "IMPORTANT: Respond completely in simple Hindi language, farmer-friendly."
)
_ENGLISH_DIRECTIVE = " Reply in clear, simple English that farmers can understand."


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
        Injects a language directive into the system prompt.
        """
        try:
            lang_instruction = _HINDI_DIRECTIVE if language == "hi" else _ENGLISH_DIRECTIVE
            full_system_prompt = system_prompt + lang_instruction

            return groq_client.get_completion(prompt, system_instruction=full_system_prompt)
        except Exception as e:
            logger.error(f"Error calling Groq via AI Core: {str(e)}")
            return "AI service unavailable."

    def analyze_image(self, image_bytes: bytes, prompt: str, language: str = "en") -> str:
        """
        Analyze image using Gemini via AI Core.
        """
        try:
            image = PIL.Image.open(io.BytesIO(image_bytes))

            if language == "hi":
                sys_prompt = (
                    "तुम एक भारतीय कृषि और पादप रोग विशेषज्ञ हो। "
                    "अपना पूरा जवाब सरल हिंदी में दो जो किसान समझ सकें। "
                    "You are an expert agricultural plant disease specialist. "
                    "Respond completely in Hindi."
                )
            else:
                sys_prompt = (
                    "You are an expert agricultural plant disease specialist. "
                    "Reply in clear, simple English."
                )

            return gemini_vision_client.get_vision_completion(prompt, image, system_instruction=sys_prompt)
        except Exception as e:
            logger.error(f"Error calling Gemini via AI Core: {str(e)}")
            return "Image analysis failed."

ai_orchestrator = AIOrchestrator()

