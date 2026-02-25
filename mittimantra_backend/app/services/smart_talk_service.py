import logging
import re
from typing import Dict, Any, List
from .ai_orchestrator import ai_orchestrator
from app.ai_core.prompt_manager import load_prompt

logger = logging.getLogger(__name__)

class SmartTalkService:
    def __init__(self):
        pass

    def get_smart_response(
        self,
        user_query: str,
        language: str = "en",
        context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Get a smart conversational response with options.
        """
        try:
            # Load Prompt Template
            prompt_template = load_prompt("conversation_prompt.txt")
            
            # Format History
            history_str = ""
            if context and "history" in context:
                # Assuming history is list of {"role": "user/ai", "content": "..."}
                for msg in context["history"]:
                    role = "User" if msg.get("role") == "user" else "Assistant"
                    history_str += f"{role}: {msg.get('content')}\n"
            
            # Construct Prompt
            # The prompt template expects {history}, {user_input}, {language}
            # Note: conversation_prompt.txt might need adjustment if I didn't check it closely.
            # I read it: "Current Chat History:\n{history}\n\nUser Input: {user_input}"
            
            prompt = prompt_template.format(
                history=history_str,
                user_input=user_query,
                language="Hindi" if language == "hi" else "English"
            )
            
            # Add strict JSON requirement which might not be in the text file prompt
            prompt += """
            
            IMPORTANT: You must return the response in valid JSON format:
            {
                "answer": "The spoken answer text...",
                "options": ["Option 1", "Option 2", "Option 3"]
            }
            Do not include any markdown formatting or explanations outside the JSON.
            """
            
            system_prompt = load_prompt("system_prompt.txt")
            
            response_str = ai_orchestrator.get_llm_response(
                prompt=prompt,
                system_prompt=system_prompt,
                language=language,
                json_mode=True
            )
            
            # Parse JSON response
            import json
            try:
                response_data = json.loads(response_str)
            except json.JSONDecodeError:
                # Fallback if LLM returns invalid JSON
                logger.warning("LLM returned invalid JSON, attempting cleanup")
                # Try to extract JSON part if wrapped in markdown
                match = re.search(r'\{.*\}', response_str, re.DOTALL)
                if match:
                    response_data = json.loads(match.group(0))
                else:
                    # Fallback to text response if JSON fails completely
                    return {
                        "answer": response_str,
                        "options": ["Ask about crops", "Ask about weather", "End chat"]
                    }

            # Clean text for speech
            if "answer" in response_data:
                response_data["answer"] = self._clean_text_for_speech(response_data["answer"])
            
            return response_data

        except Exception as e:
            logger.error(f"Error in Smart Talk service: {str(e)}")
            return {
                "answer": "I'm having trouble connecting to my brain right now. Please try again.",
                "options": ["Try again", "Go to menu", "Check internet"],
                "language": language
            }

    def _clean_text_for_speech(self, text: str) -> str:
        """
        Remove symbols and formatting that sounds bad in TTS.
        """
        # Remove markdown bold/italic
        text = re.sub(r'\*+', '', text)
        text = re.sub(r'_+', '', text)
        text = re.sub(r'#+', '', text)
        text = re.sub(r'-+', '', text)
        text = re.sub(r'`+', '', text)
        
        # Replace common symbols with words if necessary, or just remove
        text = text.replace('&', 'and')
        text = text.replace('%', ' percent')
        
        return text.strip()

smart_talk_service = SmartTalkService()
