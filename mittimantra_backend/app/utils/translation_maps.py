"""
app/utils/translation_maps.py
==============================
Translation maps for ML model outputs and static labels.
Used to convert English labels → Hindi when language = "hi".
"""

from typing import Optional

# ---------------------------------------------------------------------------
# Crop name translations (covers the standard 22-class dataset + extras)
# ---------------------------------------------------------------------------
HINDI_CROP_MAP: dict = {
    "rice":         "धान",
    "wheat":        "गेहूं",
    "maize":        "मक्का",
    "cotton":       "कपास",
    "sugarcane":    "गन्ना",
    "jute":         "जूट",
    "chickpea":     "चना",
    "lentil":       "मसूर",
    "pigeonpeas":   "अरहर (तुअर)",
    "mungbean":     "मूंग",
    "blackgram":    "उड़द",
    "kidneybeans":  "राजमा",
    "mothbeans":    "मोठ",
    "apple":        "सेब",
    "banana":       "केला",
    "mango":        "आम",
    "grapes":       "अंगूर",
    "watermelon":   "तरबूज",
    "muskmelon":    "खरबूज",
    "orange":       "संतरा",
    "papaya":       "पपीता",
    "pomegranate":  "अनार",
    "coconut":      "नारियल",
    "coffee":       "कॉफी",
    "tea":          "चाय",
    "potato":       "आलू",
    "tomato":       "टमाटर",
    "onion":        "प्याज",
    "garlic":       "लहसुन",
    "soybean":      "सोयाबीन",
    "sunflower":    "सूरजमुखी",
    "mustard":      "सरसों",
    "groundnut":    "मूंगफली",
    "peanut":       "मूंगफली",
    "cucumber":     "खीरा",
    "pea":          "मटर",
    "gram":         "चना",
    "moong dal":    "मूंग दाल",
    "General Vegetables": "सामान्य सब्जियाँ",
    "Millets":      "बाजरा / मोटे अनाज",
}

# ---------------------------------------------------------------------------
# Soil type translations
# ---------------------------------------------------------------------------
HINDI_SOIL_MAP: dict = {
    "Loamy Soil":    "दोमट मिट्टी",
    "Clay Soil":     "चिकनी मिट्टी",
    "Sandy Soil":    "रेतीली मिट्टी",
    "Black Soil":    "काली मिट्टी",
    "Red Soil":      "लाल मिट्टी",
    "Alluvial Soil": "जलोढ़ मिट्टी",
    "Loamy":         "दोमट",
    "Clay":          "चिकनी मिट्टी",
    "Sandy":         "रेतीली मिट्टी",
    "Black":         "काली मिट्टी",
    "Red":           "लाल मिट्टी",
    "Alluvial":      "जलोढ़ मिट्टी",
}

# ---------------------------------------------------------------------------
# Disease name translations
# ---------------------------------------------------------------------------
HINDI_DISEASE_MAP: dict = {
    "Angular Leaf Spot":           "कोणीय पत्ती धब्बा रोग",
    "Late Blight":                 "लेट ब्लाइट (पछेती अंगमारी)",
    "Early Blight":                "अर्ली ब्लाइट (अगेती अंगमारी)",
    "Leaf Curl":                   "पत्ती मुड़न रोग",
    "Leaf Curl Virus":             "पत्ती मुड़न वायरस",
    "Powdery Mildew":              "ख़स्ता फफूंदी",
    "Downy Mildew":                "मृदु फफूंदी",
    "Bacterial Spot":              "जीवाणु धब्बा रोग",
    "Bacterial Wilt":              "जीवाणु म्लानि रोग",
    "Bacterial Blight":            "जीवाणु अंगमारी",
    "Bacterial Leaf Spot":         "जीवाणु पत्ती धब्बा",
    "Leaf Mold":                   "पत्ती फफूंद",
    "Leaf Blast":                  "पत्ती ब्लास्ट",
    "Neck Blast":                  "गर्दन ब्लास्ट",
    "Brown Spot":                  "भूरा धब्बा रोग",
    "Septoria Leaf Spot":          "सेप्टोरिया पत्ती धब्बा",
    "Fusarium Wilt":               "फ्यूजेरियम म्लानि",
    "Alternaria Blight":           "अल्टरनेरिया अंगमारी",
    "Anthracnose":                 "एन्थ्राक्नोज",
    "Rust":                        "रतुआ रोग",
    "Scab":                        "खुरदरापन रोग",
    "Black Rot":                   "काला सड़न रोग",
    "Mosaic Virus":                "मोज़ेक वायरस",
    "Yellow Vein Mosaic":          "पीली नस मोज़ेक",
    "Damping Off":                 "आर्द्र गलन रोग",
    "Root Rot":                    "जड़ सड़न",
    "Crown Rot":                   "तना सड़न",
    "Stem Rot":                    "तना गलन",
    "Leaf Spot":                   "पत्ती धब्बा रोग",
    "Blight":                      "अंगमारी रोग",
    "Wilt Disease":                "म्लानि रोग",
    "Healthy":                     "स्वस्थ पौधा",
    "Unknown Disease":             "अज्ञात रोग",
    "Analysis Failed":             "विश्लेषण विफल",
    "AI Service Unavailable":      "AI सेवा अनुपलब्ध",
    "Service Busy — Please Retry": "सेवा व्यस्त है — कृपया पुनः प्रयास करें",
    "Service Unavailable (Quota Exceeded)": "सेवा अनुपलब्ध (कोटा समाप्त)",
}

# ---------------------------------------------------------------------------
# Severity translations
# ---------------------------------------------------------------------------
HINDI_SEVERITY_MAP: dict = {
    "None":     "कोई नहीं",
    "Low":      "कम",
    "Medium":   "मध्यम",
    "High":     "अधिक",
    "Very High":"बहुत अधिक",
    "Unknown":  "अज्ञात",
}

# ---------------------------------------------------------------------------
# Season translations (for display)
# ---------------------------------------------------------------------------
HINDI_SEASON_MAP: dict = {
    "Kharif": "खरीफ",
    "Rabi":   "रबी",
    "Zaid":   "जायद",
}

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def translate_crop(name: str, language: str) -> str:
    """Translate a crop name to Hindi if language is 'hi'."""
    if language != "hi" or not name:
        return name
    return HINDI_CROP_MAP.get(name.lower().strip(), HINDI_CROP_MAP.get(name.strip(), name))


def translate_soil(name: str, language: str) -> str:
    """Translate a soil type name to Hindi if language is 'hi'."""
    if language != "hi" or not name:
        return name
    return HINDI_SOIL_MAP.get(name.strip(), name)


def translate_disease(name: str, language: str) -> str:
    """Translate a disease name to Hindi if language is 'hi'."""
    if language != "hi" or not name:
        return name
    return HINDI_DISEASE_MAP.get(name.strip(), name)


def translate_severity(name: str, language: str) -> str:
    """Translate severity label to Hindi if language is 'hi'."""
    if language != "hi" or not name:
        return name
    return HINDI_SEVERITY_MAP.get(name.strip(), name)


def translate_crop_list(crops: list, language: str) -> list:
    """Translate a list of crop names."""
    if language != "hi":
        return crops
    return [translate_crop(c, language) for c in (crops or [])]


def get_hindi_prompt_directive() -> str:
    """Return the Hindi language directive to inject into AI prompts."""
    return (
        "\n\nMahattvapoorn / महत्वपूर्ण: "
        "पूरा उत्तर सरल हिंदी में दें जो किसानों के लिए समझने में आसान हो। "
        "अंग्रेजी तकनीकी शब्दों का उपयोग केवल तभी करें जब कोई हिंदी विकल्प न हो। "
        "IMPORTANT: Respond completely in Hindi using simple, farmer-friendly language."
    )
