"""
Disease AI Service
==================
Plant disease detection using Gemini Vision API with automatic model
fallback (gemini-2.0-flash → gemini-1.5-flash → gemini-1.5-flash-8b → …).

The service handles three response styles:
  • Structured   — Gemini follows the labelled-section prompt exactly.
  • Markdown     — Gemini uses ## headers and prose paragraphs.
  • Free-form    — Gemini returns pure prose without clear structure.

All three styles are parsed into a normalised dict the frontend renders.
"""

import logging
import re
from typing import Dict, Any, List

from .disease_service import DiseaseDetectionService
from .ai_orchestrator import ai_orchestrator
from app.ai_core.prompt_manager import load_prompt
from app.ai_core.rule_based_fallbacks import get_disease_fallback
from app.utils.translation_maps import translate_disease, translate_severity, get_hindi_prompt_directive

logger = logging.getLogger(__name__)


class DiseaseAIService:
    """
    Hybrid disease detection:
      1. Gemini Vision API  — primary (all models tried via fallback chain)
      2. Rule-based fallback — only when every Gemini model fails
    """

    def __init__(self):
        self.disease_service = DiseaseDetectionService()

    # ── Public method ────────────────────────────────────────────────────────

    def detect_disease_and_advise(
        self,
        image_bytes: bytes,
        language: str = "en",
        crop_name: str = "the crop",
    ) -> Dict[str, Any]:
        """
        Analyse a leaf image and return structured disease advice.

        Returns a dict with keys:
          disease, affected_plant, confidence, severity,
          cause, symptoms_observed, immediate_precautions,
          treatment, organic_solutions, chemical_solutions,
          prevention_methods, recovery_outlook, farmer_advice,
          ai_advice (raw Gemini text), source, language
        """
        try:
            # 1. Load prompt template
            prompt_template = load_prompt("disease_prompt.txt")
            prompt = prompt_template.format(crop_name=crop_name)

            # 2. Inject language directive for Hindi
            if language == "hi":
                prompt += get_hindi_prompt_directive()

            logger.info(
                "Sending image to Gemini Vision (fallback chain active, %d bytes) …",
                len(image_bytes),
            )

            # 2. Call Gemini Vision (auto-fallback handled inside client)
            ai_response = ai_orchestrator.analyze_image(
                image_bytes=image_bytes,
                prompt=prompt,
                language=language,
            )

            logger.debug("Raw Gemini response:\n%s", ai_response)

            # 3. Detect hard failure
            if not ai_response or not ai_response.strip():
                raise ValueError("Gemini returned an empty response.")

            if ai_response.startswith("Error:"):
                raise ValueError(ai_response)

            if "image analysis failed" in ai_response.lower():
                raise ValueError("Image analysis pipeline failed.")

            # 4. Parse the response
            parsed = self._parse_response(ai_response)

            # 5. Translate labels if Hindi
            parsed["disease"] = translate_disease(parsed["disease"], language)
            parsed["severity"] = translate_severity(parsed["severity"], language)

            logger.info(
                "Disease detection succeeded: %s | plant=%s | severity=%s | confidence=%.2f",
                parsed["disease"],
                parsed["affected_plant"],
                parsed["severity"],
                parsed["confidence"],
            )

            return {
                **parsed,
                "ai_advice": ai_response,
                "source": "gemini",
                "language": language,
            }

        except Exception as exc:
            logger.warning(
                "Disease detection failed: %s — using rule-based fallback.", exc
            )
            return self._build_fallback_response(language, error_hint=str(exc))

    # ── Parser dispatcher ─────────────────────────────────────────────────────

    def _parse_response(self, text: str) -> Dict[str, Any]:
        """
        Dispatch to the best parser for the response style.
        Order: structured (CAPS labels) → markdown (## headers) → free-form prose.
        """
        if self._looks_structured(text):
            logger.debug("Parsing as structured (CAPS labels) response.")
            result = self._parse_structured(text)
        elif self._looks_markdown(text):
            logger.debug("Parsing as markdown (## headers) response.")
            result = self._parse_markdown(text)
        else:
            logger.debug("Parsing as free-form prose response.")
            result = self._parse_freeform(text)

        # Post-processing: ensure we never return bare "Plant" when there's more info
        result = self._post_process(result, text)
        return result

    # ── Style detectors ───────────────────────────────────────────────────────

    def _looks_structured(self, text: str) -> bool:
        """Returns True if the text contains at least 3 CAPS labelled section headers."""
        markers = [
            "DISEASE_NAME:", "SEVERITY:", "CAUSE:", "TREATMENT:",
            "ORGANIC_SOLUTIONS:", "PREVENTION_METHODS:", "FARMER_ADVICE:",
            "AFFECTED_PLANT:", "CONFIDENCE:", "SYMPTOMS_OBSERVED:",
        ]
        hits = sum(1 for m in markers if m in text.upper())
        return hits >= 3

    def _looks_markdown(self, text: str) -> bool:
        """Returns True if the text uses markdown ## headers for sections."""
        md_patterns = [
            r"^#{1,3}\s+.*(disease|severity|cause|treatment|prevention|advice|symptom)",
            r"^\*\*[A-Z].{2,30}\*\*:",
        ]
        for pat in md_patterns:
            if re.search(pat, text, re.M | re.I):
                return True
        return False

    # ── Structured parser (CAPS label format) ────────────────────────────────

    def _parse_structured(self, text: str) -> Dict[str, Any]:
        """Parse the labelled-section format produced by disease_prompt.txt."""

        # Strip surrounding --- markers if present
        text = re.sub(r"^---\s*$", "", text, flags=re.M).strip()

        def _field(label: str) -> str:
            m = re.search(rf"^{re.escape(label)}:\s*(.+)$", text, re.M | re.I)
            return m.group(1).strip() if m else ""

        def _section(label: str) -> str:
            # Match content between this label and next CAPS label or end
            m = re.search(
                rf"^{re.escape(label)}:\s*\n(.*?)(?=\n[A-Z_]{{3,}}:|$)",
                text, re.DOTALL | re.M | re.I,
            )
            return m.group(1).strip() if m else ""

        def _bullets(label: str) -> List[str]:
            raw = _section(label)
            items = []
            for line in raw.splitlines():
                clean = re.sub(r"^[\-\*\•\d+\.]\s*", "", line.strip())
                if clean and len(clean) > 3:
                    items.append(clean)
            return items

        disease_raw = _field("DISEASE_NAME")
        severity_raw = _field("SEVERITY")
        confidence_raw = _field("CONFIDENCE")
        plant_raw = _field("AFFECTED_PLANT")

        disease = disease_raw if disease_raw else self._extract_disease_freeform(text, text.lower())
        severity = self._normalise_severity(severity_raw)
        confidence = self._confidence_to_float(confidence_raw)

        return {
            "disease": disease or "Unknown Disease",
            "affected_plant": plant_raw or self._guess_plant(text.lower()),
            "confidence": confidence,
            "severity": severity,
            "cause": _section("CAUSE"),
            "symptoms_observed": _section("SYMPTOMS_OBSERVED"),
            "immediate_precautions": _bullets("IMMEDIATE_PRECAUTIONS"),
            "treatment": _bullets("TREATMENT"),
            "organic_solutions": _bullets("ORGANIC_SOLUTIONS"),
            "chemical_solutions": _bullets("CHEMICAL_SOLUTIONS"),
            "prevention_methods": _bullets("PREVENTION_METHODS"),
            "recovery_outlook": _section("RECOVERY_OUTLOOK"),
            "farmer_advice": _section("FARMER_ADVICE"),
        }

    # ── Markdown parser (## header format) ───────────────────────────────────

    def _parse_markdown(self, text: str) -> Dict[str, Any]:
        """Parse markdown-structured Gemini responses with ## section headers."""

        def _section_text(heading_pattern: str) -> str:
            """Extract text following a heading matching the pattern."""
            m = re.search(
                rf"^#{1,3}\s+{heading_pattern}.*?$\n(.*?)(?=^#{1,3}\s|\Z)",
                text, re.M | re.DOTALL | re.I
            )
            return m.group(1).strip() if m else ""

        def _bold_field(pattern: str) -> str:
            """Extract value following a bold label like **Disease Name:** Blight"""
            m = re.search(rf"\*\*{pattern}[:\s]+\*\*\s*(.+?)(?:\n|$)", text, re.I)
            if m:
                return m.group(1).strip()
            m = re.search(rf"\*\*{pattern}\*\*[:\s]+(.+?)(?:\n|$)", text, re.I)
            return m.group(1).strip() if m else ""

        def _bullets_from_section(heading_pattern: str) -> List[str]:
            raw = _section_text(heading_pattern)
            items = []
            for line in raw.splitlines():
                clean = re.sub(r"^[\-\*\•\d+\.]\s*", "", line.strip())
                if clean and len(clean) > 3:
                    items.append(clean)
            return items

        # Extract disease from first bold text or heading
        disease = (
            _bold_field("Disease(?:\\s+Name)?")
            or _bold_field("Diagnosis")
            or self._extract_disease_freeform(text, text.lower())
        )

        # Plant
        plant = (
            _bold_field("(?:Affected\\s+)?Plant(?:\\s+Type)?")
            or _bold_field("Crop")
            or self._guess_plant(text.lower())
        )

        # Severity
        sev_raw = _bold_field("Severity") or ""
        for word in ("very high", "high", "medium", "moderate", "low", "none"):
            if word in sev_raw.lower():
                sev_raw = word
                break
        if not sev_raw:
            for word in ("very high", "high", "medium", "moderate", "low"):
                if word in text.lower()[:500]:
                    sev_raw = word
                    break
        severity = self._normalise_severity(sev_raw)

        # Confidence
        conf_raw = _bold_field("Confidence") or ""
        confidence = self._confidence_to_float(conf_raw) if conf_raw else self._estimate_confidence(text, disease)

        # Sections
        cause = (
            _section_text("cause|etiology")
            or _section_text("what.*causes")
            or ""
        )
        symptoms = (
            _section_text("symptoms?|signs?|observed")
            or ""
        )
        precautions = (
            _bullets_from_section("immediate|precaution|action")
            or []
        )
        treatment = (
            _bullets_from_section("treatment|management|control")
            or []
        )
        organic = _bullets_from_section("organic") or []
        chemical = _bullets_from_section("chemical|fungicide|bactericide|pesticide") or []
        prevention = _bullets_from_section("prevent") or []
        recovery = _section_text("recover|prognosis|outlook") or ""
        farmer_advice = (
            _section_text("farmer|advice|recommendation")
            or self._extract_farmer_advice(text)
        )

        return {
            "disease": disease or "Unknown Disease",
            "affected_plant": plant,
            "confidence": confidence,
            "severity": severity,
            "cause": cause,
            "symptoms_observed": symptoms,
            "immediate_precautions": precautions,
            "treatment": treatment,
            "organic_solutions": organic,
            "chemical_solutions": chemical,
            "prevention_methods": prevention,
            "recovery_outlook": recovery,
            "farmer_advice": farmer_advice,
        }

    # ── Free-form prose parser ────────────────────────────────────────────────

    def _parse_freeform(self, text: str) -> Dict[str, Any]:
        """
        Extract structured info from free-form Gemini prose.
        Uses keyword matching and heuristics.
        """
        text_lower = text.lower()

        # Disease
        disease = self._extract_disease_freeform(text, text_lower)

        # Plant
        plant = self._guess_plant(text_lower)

        # Severity
        severity_raw = ""
        for word in ("very high", "high", "medium", "moderate", "low", "none"):
            if word in text_lower:
                severity_raw = word
                break
        severity = self._normalise_severity(severity_raw)

        # Confidence
        confidence = self._estimate_confidence(text_lower, disease)

        def _para_after(keyword: str) -> str:
            """Return the paragraph following the first line that contains keyword."""
            lines = text.splitlines()
            for i, line in enumerate(lines):
                if keyword.lower() in line.lower():
                    chunk = []
                    for j in range(i + 1, min(i + 8, len(lines))):
                        if lines[j].strip():
                            chunk.append(lines[j].strip())
                        else:
                            if chunk:
                                break
                    return " ".join(chunk)
            return ""

        def _bullets_after(keyword: str) -> List[str]:
            lines = text.splitlines()
            result = []
            capturing = False
            for line in lines:
                stripped = line.strip()
                if keyword.lower() in stripped.lower():
                    capturing = True
                    continue
                if capturing:
                    if re.match(r"^[\-\*\•\d]", stripped):
                        clean = re.sub(r"^[\-\*\•\d+\.]\s*", "", stripped)
                        if clean and len(clean) > 3:
                            result.append(clean)
                    elif stripped == "":
                        if result:
                            break
                    elif result:
                        break
            return result

        cause = _para_after("caused by") or _para_after("cause") or ""
        precautions = _bullets_after("precaution") or _bullets_after("immediate action") or []
        treatment = _bullets_after("treatment") or _bullets_after("manage") or []
        organic = _bullets_after("organic") or []
        chemical = (
            _bullets_after("chemical") or _bullets_after("fungicide")
            or _bullets_after("bactericide") or []
        )
        prevention = _bullets_after("prevent") or []
        recovery = _para_after("recover") or _para_after("prognosis") or ""
        farmer_advice = (
            _para_after("farmer") or _para_after("advice")
            or self._extract_farmer_advice(text)
        )

        return {
            "disease": disease,
            "affected_plant": plant,
            "confidence": confidence,
            "severity": severity,
            "cause": cause,
            "symptoms_observed": "",
            "immediate_precautions": precautions,
            "treatment": treatment,
            "organic_solutions": organic,
            "chemical_solutions": chemical,
            "prevention_methods": prevention,
            "recovery_outlook": recovery,
            "farmer_advice": farmer_advice,
        }

    # ── Post-processor ───────────────────────────────────────────────────────

    def _post_process(self, result: Dict[str, Any], raw_text: str) -> Dict[str, Any]:
        """
        Final clean-up pass on parsed result:
        - Ensure plant name is not bare 'Plant' if we can do better
        - Ensure farmer_advice is non-empty (use raw text excerpt if needed)
        - Ensure disease is not 'Unknown Disease' if raw_text mentions one
        """
        text_lower = raw_text.lower()

        # Better plant detection if generic
        if result.get("affected_plant", "").lower() in ("", "plant", "unknown"):
            better_plant = self._guess_plant(text_lower)
            if better_plant.lower() != "plant":
                result["affected_plant"] = better_plant

        # Better disease if 'Unknown'
        if result.get("disease", "").lower() in ("", "unknown disease", "unknown"):
            found = self._extract_disease_freeform(raw_text, text_lower)
            if found.lower() not in ("unknown disease",):
                result["disease"] = found

        # Ensure farmer_advice always has content
        if not result.get("farmer_advice"):
            result["farmer_advice"] = self._extract_farmer_advice(raw_text)

        # Ensure non-zero confidence for a real detection
        if result["disease"].lower() not in ("unknown disease", "healthy") and result["confidence"] < 0.1:
            result["confidence"] = 0.75

        return result

    # ── Shared helpers ────────────────────────────────────────────────────────

    DISEASE_KEYWORDS = {
        "angular leaf spot":    "Angular Leaf Spot",
        "late blight":          "Late Blight",
        "early blight":         "Early Blight",
        "leaf curl":            "Leaf Curl",
        "leaf curl virus":      "Leaf Curl Virus",
        "powdery mildew":       "Powdery Mildew",
        "downy mildew":         "Downy Mildew",
        "bacterial spot":       "Bacterial Spot",
        "bacterial wilt":       "Bacterial Wilt",
        "bacterial blight":     "Bacterial Blight",
        "bacterial leaf spot":  "Bacterial Leaf Spot",
        "leaf mold":            "Leaf Mold",
        "leaf blast":           "Leaf Blast",
        "neck blast":           "Neck Blast",
        "brown spot":           "Brown Spot",
        "septoria":             "Septoria Leaf Spot",
        "fusarium":             "Fusarium Wilt",
        "alternaria":           "Alternaria Blight",
        "anthracnose":          "Anthracnose",
        "rust":                 "Rust",
        "scab":                 "Scab",
        "black rot":            "Black Rot",
        "mosaic virus":         "Mosaic Virus",
        "mosaic":               "Mosaic Virus",
        "yellow vein":          "Yellow Vein Mosaic",
        "damping off":          "Damping Off",
        "root rot":             "Root Rot",
        "crown rot":            "Crown Rot",
        "stem rot":             "Stem Rot",
        "leaf spot":            "Leaf Spot",
        "blight":               "Blight",
        "wilt":                 "Wilt Disease",
        "healthy":              "Healthy",
    }

    PLANT_KEYWORDS = [
        "cucumber", "tomato", "potato", "apple", "grape", "corn", "maize",
        "pepper", "capsicum", "strawberry", "cherry", "peach", "orange",
        "lemon", "citrus", "soybean", "wheat", "rice", "mango", "spinach",
        "lettuce", "bean", "pea", "chili", "chilli", "brinjal", "eggplant",
        "onion", "garlic", "cotton", "sugarcane", "sunflower", "mustard",
        "groundnut", "peanut", "coffee", "tea", "banana", "cassava",
    ]

    def _extract_disease_freeform(self, text: str, text_lower: str) -> str:
        """Try to extract disease name from free-form/markdown text."""
        # 1. Check bold/emphasis patterns like **Angular Leaf Spot** or **Angular Leaf Spot:**
        for m in re.finditer(r"\*\*([^*]{3,50})\*\*", text):
            candidate = m.group(1).strip().rstrip(":")
            # Must look like a disease name (1–5 words, title-ish)
            if 1 <= len(candidate.split()) <= 6:
                candidate_lower = candidate.lower()
                # Prefer if it matches a known disease keyword
                for kw in self.DISEASE_KEYWORDS:
                    if kw in candidate_lower:
                        return self.DISEASE_KEYWORDS[kw]
                # Accept if it doesn't look like a section header (all caps = skip)
                if not candidate.isupper():
                    return candidate

        # 2. Look for "diagnosed as X", "identified as X", "disease is X"
        patterns = [
            r"(?:disease(?:\s+is)?|diagnosed(?:\s+as)?|identified(?:\s+as)?|detected(?:\s+is)?)[:\s]+([A-Z][a-zA-Z\s]{3,40})",
            r"(?:suffering from|infected with|affected by)[:\s]+([A-Z][a-zA-Z\s]{3,40})",
            r"image (?:shows?|reveals?|indicates?)[:\s]+([A-Z][a-zA-Z\s]{3,40})",
        ]
        for pat in patterns:
            m = re.search(pat, text, re.I)
            if m:
                candidate = m.group(1).strip().rstrip(".")
                for kw in self.DISEASE_KEYWORDS:
                    if kw in candidate.lower():
                        return self.DISEASE_KEYWORDS[kw]
                if len(candidate.split()) <= 5:
                    return candidate

        # 3. Keyword scan (most-specific first)
        for kw, label in self.DISEASE_KEYWORDS.items():
            if kw in text_lower:
                return label

        return "Unknown Disease"

    def _guess_plant(self, text_lower: str) -> str:
        for p in self.PLANT_KEYWORDS:
            if p in text_lower:
                return p.capitalize()
        return "Plant"

    def _estimate_confidence(self, text_lower: str, disease: str) -> float:
        """Estimate confidence from language cues in the text."""
        if any(w in text_lower for w in ("high confidence", "clearly", "definitively", "strongly suggest", "certainly")):
            return 0.90
        if any(w in text_lower for w in ("medium confidence", "likely", "appears to be", "seems to be", "consistent with")):
            return 0.75
        if any(w in text_lower for w in ("low confidence", "unclear", "cannot determine", "hard to tell", "uncertain")):
            return 0.45
        if disease.lower() not in ("unknown disease", "healthy"):
            return 0.78   # identified something → reasonable confidence
        return 0.40

    def _extract_farmer_advice(self, text: str) -> str:
        """Extract 2-3 plain sentences as farmer advice from the text."""
        sentences = re.split(r"(?<=[.!?])\s+", text.strip())
        # Prefer sentences in the second half of the text (more likely to be advice)
        half = len(sentences) // 2
        advice_sentences = sentences[half:half + 3] or sentences[:3]
        advice = " ".join(s.strip() for s in advice_sentences if len(s.strip()) > 20)
        return advice[:500] if advice else text[:300]

    def _normalise_severity(self, raw: str) -> str:
        raw = (raw or "").lower().strip()
        mapping = {
            "none":     "None",
            "low":      "Low",
            "medium":   "Medium",
            "moderate": "Medium",
            "high":     "High",
            "very high": "Very High",
            "severe":   "High",
            "critical": "Very High",
        }
        return mapping.get(raw, raw.capitalize() if raw else "Unknown")

    def _confidence_to_float(self, raw: str) -> float:
        raw = (raw or "").lower().strip()
        # Handle percentage strings like "85%" or "0.85"
        pct_m = re.match(r"(\d+(?:\.\d+)?)\s*%?$", raw)
        if pct_m:
            val = float(pct_m.group(1))
            return val / 100.0 if val > 1 else val
        return {"low": 0.45, "medium": 0.72, "high": 0.90}.get(raw, 0.80)

    # ── Fallback response ─────────────────────────────────────────────────────

    def _build_fallback_response(
        self, language: str, error_hint: str = ""
    ) -> Dict[str, Any]:
        """
        Return a rule-based fallback.
        When the error is quota-related, give a clear user message
        instead of a generic "Unknown Disease".
        """
        is_quota = "429" in error_hint or "RESOURCE_EXHAUSTED" in error_hint or "quota" in error_hint.lower()
        is_overload = "503" in error_hint or "UNAVAILABLE" in error_hint or "overload" in error_hint.lower()
        is_api_failure = "All Gemini models failed" in error_hint

        if is_quota or (is_api_failure and "RESOURCE_EXHAUSTED" in error_hint):
            farmer_advice = (
                "The AI analysis service is temporarily unavailable due to high usage "
                "(API quota exceeded). The system already tried multiple model fallbacks. "
                "Please wait 1–2 minutes and try again, or consult your local agricultural "
                "extension officer for disease diagnosis."
            )
            disease = "Service Unavailable (Quota Exceeded)"
        elif is_overload:
            farmer_advice = (
                "The AI service is currently overloaded. Please wait a moment and try again."
            )
            disease = "Service Busy — Please Retry"
        elif is_api_failure:
            farmer_advice = (
                "All AI models are currently unavailable. Please try again in a few minutes."
            )
            disease = "AI Service Unavailable"
        else:
            farmer_advice = get_disease_fallback(lang=language)
            disease = "Analysis Failed"

        return {
            "disease": disease,
            "affected_plant": "Unknown",
            "confidence": 0.0,
            "severity": "Unknown",
            "cause": "",
            "symptoms_observed": "",
            "immediate_precautions": [],
            "treatment": [],
            "organic_solutions": [],
            "chemical_solutions": [],
            "prevention_methods": [],
            "recovery_outlook": "",
            "farmer_advice": farmer_advice,
            "ai_advice": error_hint or farmer_advice,
            "source": "fallback",
            "language": language,
        }


# Module-level singleton
disease_ai_service = DiseaseAIService()
