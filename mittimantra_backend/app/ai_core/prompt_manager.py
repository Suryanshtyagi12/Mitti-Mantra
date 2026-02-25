import os

def load_prompt(filename):
    """
    Loads a prompt file from the local 'prompts' directory.
    """
    base_path = os.path.dirname(os.path.abspath(__file__))
    prompt_path = os.path.join(base_path, "prompts", filename)
    try:
        with open(prompt_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        print(f"Error loading prompt {filename}: {e}")
        return ""
