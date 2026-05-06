# PROJECT SUMMARY — Mitti Mantra 🌾
> **AI-Powered Agricultural Decision Support System**

---

## 1. Project Overview

### Project Name
**Mitti Mantra** (Hindi: "Mantra of the Soil")

### Objective / Problem Statement
Indian farmers — particularly small and marginal landholders — often lack access to timely, expert agricultural advice. Poor crop selection, undetected plant diseases, suboptimal irrigation, and pest outbreaks collectively result in significant yield losses and economic hardship. Mitti Mantra addresses this gap by providing a **web-based AI advisory platform** that delivers intelligent, data-driven recommendations across the entire farming lifecycle. The system brings precision agriculture capabilities to farmers who previously had no access to such technology, using a simple browser-based interface that supports both English and Hindi.

### Key Features

| Feature | Description |
|---|---|
| **Crop Recommendation** | Predicts optimal crops using soil NPK values, temperature, humidity, pH, and rainfall via an ML model with LLM explanation |
| **Disease Detection** | Detects plant diseases from uploaded leaf images using a hybrid ML + Gemini Vision pipeline |
| **Irrigation Scheduling** | Computes science-based irrigation plans combining rule-based evapotranspiration formulas and LLM advisory |
| **Pest & Disease Control** | Image-based pest identification with organic, chemical, and preventive recommendations |
| **Track Farming** | Persistent per-user farming records with AI-generated daily task advice based on crop growth stage |
| **AI Voice Assistant (Smart Talk)** | Floating conversational chatbot with Speech-to-Text and Text-to-Speech support in English and Hindi |
| **Risk Alerts** | Seasonal, crop-specific risk alerts (pest pressure, disease, weather) |
| **Analytics Dashboard** | Summarises farming history and provides pattern-based insights |
| **Secure Auth System** | JWT-based authentication with registration, login, logout, and protected routes |

---

## 2. Tech Stack

### Programming Languages
- **Python 3.8+** — Backend services, ML model inference, AI orchestration
- **JavaScript (ES2022+)** — React frontend, API communication, browser speech APIs

### Frameworks & Libraries

#### Backend
| Library | Version | Purpose |
|---|---|---|
| FastAPI | 0.115.5 | Async REST API framework |
| Uvicorn | 0.34.0 | ASGI server |
| SQLAlchemy | 2.0.35 | ORM for relational database access |
| Alembic | 1.14.0 | Database migration management |
| Pydantic | 2.10.3 | Request/response data validation |
| Python-JOSE | 3.3.0 | JWT creation and verification |
| Passlib + Bcrypt | 1.7.4 / 3.2.2 | Password hashing (cost factor 12) |
| Jinja2 | — | Server-side HTML templates (legacy auth pages) |
| Scikit-learn | 1.8.0 | ML model inference (crop, disease) |
| TensorFlow | 2.18.0 | Deep learning model support |
| XGBoost / LightGBM / CatBoost | 2.1.3 / 4.5.0 / 1.2.7 | Gradient boosting model compatibility |
| Pillow | 11.0.0 | Image decoding for disease/pest detection |
| NumPy | 1.26.4 | Numerical array operations for ML features |
| Joblib | 1.4.2 | Loading serialised ML model `.pkl` files |
| Groq SDK | latest | LLM chat completions (Llama 3.1 8B Instant) |
| Google Generative AI | latest | Gemini 1.5 Flash vision-language model |
| python-dotenv | 1.0.1 | Environment variable management |
| psycopg2-binary | 2.9.10 | PostgreSQL driver (production database) |

#### Frontend
| Library | Version | Purpose |
|---|---|---|
| React | 18.2.0 | UI component library |
| React Router DOM | 6.30.3 | Client-side SPA routing |
| Vite | 5.1.0 | Build tool and dev server |
| Tailwind CSS | 3.4.1 | Utility-first CSS framework |
| Framer Motion | 11.0.5 | Declarative animations and transitions |
| Axios | 1.6.7 | HTTP client with interceptors |
| React Toastify | 10.0.4 | Toast notification system |
| React Icons | 5.0.1 | Icon library (Font Awesome subset) |
| Recharts | 2.12.0 | Charting library for analytics views |

### Tools and Platforms
- **SQLite** — Default development database (`mittimantra.db`)
- **PostgreSQL** — Supported production database (via `DATABASE_URL` env var)
- **Render.com** — Primary deployment target (`render.yaml` provided)
- **Vercel / Netlify** — Recommended frontend deployment platforms
- **Git** — Version control
- **Groq Cloud** — Fast LLM inference API
- **Google AI Studio** — Gemini 1.5 Flash image analysis API

---

## 3. System Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        USER BROWSER                          │
│                    React 18 SPA (Vite)                       │
│         Port 3000/5173 | Tailwind CSS | Framer Motion        │
└──────────────────────────┬───────────────────────────────────┘
                           │  HTTPS / REST (JSON + multipart)
                           │  Authorization: Bearer <JWT>
┌──────────────────────────▼───────────────────────────────────┐
│                   FastAPI Backend (Python)                    │
│                    Uvicorn ASGI | Port 8000                   │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  /api/auth  │  │  /api/ai     │  │  /predict-*, etc.  │  │
│  │  (JWT auth) │  │  (AI routes) │  │  (ML endpoints)    │  │
│  └──────┬──────┘  └──────┬───────┘  └────────┬───────────┘  │
│         │                │                    │              │
│  ┌──────▼────────────────▼────────────────────▼───────────┐  │
│  │                   Service Layer                         │  │
│  │  crop_ai_service | disease_ai_service | irrigation_ai  │  │
│  │  smart_talk_service | track_farming_service | risk_*   │  │
│  └──────┬──────────────────────┬──────────────────────────┘  │
│         │                      │                              │
│  ┌──────▼──────┐      ┌────────▼──────────────────────────┐  │
│  │   SQLite /  │      │          AI Core Layer             │  │
│  │  PostgreSQL │      │  GroqClient (Llama 3.1 8B)         │  │
│  │  (ORM:      │      │  GeminiVisionClient (1.5 Flash)    │  │
│  │  SQLAlchemy)│      │  RuleBasedFallbacks                │  │
│  └─────────────┘      │  PromptManager (txt templates)     │  │
│                        └───────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                           │              │
                ┌──────────▼──┐    ┌──────▼──────────┐
                │  Groq Cloud │    │  Google AI Studio│
                │  (LLM API)  │    │  (Gemini Vision) │
                └─────────────┘    └─────────────────┘
```

### Data Flow (Frontend → Backend → AI/DB → Response)

1. **User** submits a form or speaks a query in the browser.
2. **React** component calls a method on the centralised `apiService` (Axios).
3. **Axios request interceptor** injects the JWT `Bearer` token from `localStorage`.
4. **FastAPI router** matches the endpoint, validates the request schema via Pydantic, and authenticates the user (where required) via the `get_current_active_user` dependency.
5. The **Service Layer** orchestrates:
   - An optional **ML model inference** (via Joblib/Scikit-learn).
   - An **LLM call** to Groq (text) or Gemini (image) via the `AIOrchestrator`.
   - A **rule-based fallback** if either external service is unavailable.
6. Results are persisted to the **SQLite/PostgreSQL database** via SQLAlchemy ORM.
7. A **structured JSON response** is returned to the frontend.
8. The **React component** renders the result; the `VoiceAssistant` may additionally speak the response via the **Web Speech API**.

### Major Modules / Components

| Module | Location | Role |
|---|---|---|
| `main.py` | `backend/app/` | FastAPI app factory, CORS, route registration, startup/teardown |
| `auth.py` | `backend/app/` | JWT creation/decoding, password hashing, user dependency injection |
| `database.py` | `backend/app/` | SQLAlchemy engine and session factory |
| `db_models.py` | `backend/app/` | ORM table definitions (User, CropPrediction, DiseasePrediction, IrrigationSchedule, TrackFarming, FarmingAdvice) |
| `ai_routes.py` | `backend/app/routes/` | AI feature REST endpoints |
| `api_auth_routes.py` | `backend/app/routes/` | JSON auth endpoints (register, login, me, logout) |
| `AIOrchestrator` | `backend/app/services/` | Central dispatcher to Groq and Gemini clients |
| `ai_core/` | `backend/app/` | LLM clients, prompt templates, rule-based fallbacks, tracking logic |
| `AuthContext.jsx` | `frontend/src/context/` | Global auth state, login/register/logout functions |
| `api.js` | `frontend/src/services/` | Centralised Axios instance with request/response interceptors |
| `VoiceAssistant.jsx` | `frontend/src/components/` | Floating chatbot UI with Web Speech API integration |
| `App.jsx` | `frontend/src/` | Root router and layout wiring |

---

## 4. Folder & File Structure

```
Mittimantra-main/
│
├── README.md                          # Project documentation
├── requirements.txt                   # Root-level backend dependencies
├── render.yaml                        # Render.com deployment config
│
├── crop Ai/                           # Standalone Streamlit prototype (predecessor)
│   ├── app.py                         # Streamlit multi-mode crop advisor UI
│   ├── data/                          # Training datasets
│   ├── prompts/                       # Prompt templates (original)
│   └── utils/                         # LLM clients, tracking, rules (original)
│
├── mittimantra_backend/               # FastAPI production backend
│   ├── .env                           # Secret keys and API keys (gitignored)
│   ├── env.example                    # Environment variable template
│   ├── requirements.txt               # Backend Python dependencies
│   ├── mittimantra.db                 # SQLite database file
│   ├── init_db.py                     # Database initialisation script
│   ├── models/                        # Serialised ML model files (.pkl, .h5)
│   ├── static/                        # Static assets (favicon, images)
│   ├── templates/                     # Jinja2 HTML templates (legacy auth flows)
│   └── app/
│       ├── main.py                    # FastAPI app entry point
│       ├── auth.py                    # JWT & password utilities
│       ├── database.py                # SQLAlchemy engine and session
│       ├── db_models.py               # ORM data models
│       ├── schemas.py                 # Pydantic schemas (UserCreate, Token, etc.)
│       ├── ai_core/
│       │   ├── llm_groq_client.py     # Groq LLM wrapper (Llama 3.1 8B)
│       │   ├── llm_gemini_vision_client.py  # Gemini 1.5 Flash vision wrapper
│       │   ├── prompt_manager.py      # Loads prompt .txt files dynamically
│       │   ├── rule_based_fallbacks.py# Offline fallback responses (crop/disease/irrigation)
│       │   ├── tracking_logic.py      # Crop age and stage calculator
│       │   └── prompts/
│       │       ├── system_prompt.txt  # Persona and rules for the AI assistant
│       │       ├── crop_prompt.txt    # Crop recommendation prompt template
│       │       ├── disease_prompt.txt # Disease identification prompt
│       │       ├── irrigation_prompt.txt # Irrigation advice prompt
│       │       ├── conversation_prompt.txt # Smart Talk conversation prompt
│       │       └── tracking_prompt.txt    # Track Farming advice prompt
│       ├── routes/
│       │   ├── ai_routes.py           # /api/ai/* AI feature endpoints
│       │   ├── api_auth_routes.py     # /api/auth/* JSON auth endpoints
│       │   └── auth_routes.py         # /auth/* legacy HTML form auth
│       ├── services/
│       │   ├── ai_orchestrator.py     # Central LLM dispatcher
│       │   ├── crop_ai_service.py     # ML + LLM crop recommendation
│       │   ├── crop_service.py        # Pure ML crop inference
│       │   ├── disease_ai_service.py  # ML + Gemini disease detection
│       │   ├── disease_service.py     # Pure ML disease inference
│       │   ├── irrigation_ai_service.py # Rule-based + LLM irrigation
│       │   ├── irrigation_service.py  # Pure rule-based irrigation calculator
│       │   ├── pest_service.py        # Pest identification service
│       │   ├── risk_alert_service.py  # Seasonal crop risk alerts
│       │   ├── smart_talk_service.py  # Conversational AI chat service
│       │   └── track_farming_service.py # Farming records CRUD + AI advice
│       └── models/
│           ├── request_models.py      # API request Pydantic models
│           └── response_models.py     # API response Pydantic models
│
└── mittimantra_frontend/              # React SPA frontend
    ├── index.html                     # Root HTML with Vite entry point
    ├── vite.config.js                 # Vite dev server / build config
    ├── tailwind.config.js             # Tailwind CSS configuration
    ├── package.json                   # npm dependencies and scripts
    └── src/
        ├── main.jsx                   # ReactDOM render root
        ├── App.jsx                    # Router, layout, route definitions
        ├── App.css / index.css        # Global styles and Tailwind directives
        ├── context/
        │   └── AuthContext.jsx        # Global authentication state (React Context)
        ├── services/
        │   └── api.js                 # Axios instance + all API service methods
        ├── components/
        │   ├── VoiceAssistant.jsx     # Floating Smart Talk chatbot with voice
        │   ├── ProtectedRoute.jsx     # Route guard (redirects to /login if unauth)
        │   └── Layout/
        │       └── Layout.jsx         # Shared navbar + footer wrapper
        └── pages/
            ├── Home.jsx               # Landing page with feature overview
            ├── Login.jsx              # JWT login form
            ├── Register.jsx           # User registration form
            ├── Dashboard.jsx          # Analytics and activity overview page
            ├── CropRecommendation.jsx # Soil input form + AI crop suggestion
            ├── DiseaseDetection.jsx   # Image upload + disease analysis results
            ├── IrrigationScheduler.jsx# Irrigation inputs + AI schedule output
            ├── PestControl.jsx        # Image upload + organic/chemical control
            ├── TrackFarming.jsx       # Farm record management + AI advice
            └── About.jsx              # Project and team information page
```

---

## 5. Core Functionalities

### 5.1 Crop Recommendation
- The user inputs seven soil/environment parameters: Nitrogen, Phosphorus, Potassium, Temperature, Humidity, pH, and Rainfall.
- **Two modes operate in parallel:**
  - **ML Route (`/predict-crop`):** A pre-trained Scikit-learn classification model (`crop_planning_brain.pkl`) predicts the optimal crop. If the model exposes `predict_proba`, confidence scores and top-3 alternatives are extracted.
  - **AI Route (`/api/ai/crop-suggestion`):** The AI orchestrator sends a structured prompt (location, season, priority, soil type, optional NPK) to Groq (Llama 3.1 8B). The response is parsed as JSON to extract the primary crop and alternatives.
- A **rule-based fallback** activates if both routes fail, selecting crops by simple heuristic thresholds (temperature, rainfall, pH, nitrogen).
- The `CropAIService` combines both: it runs the ML prediction first, then generates an explanatory LLM narrative around that result.

### 5.2 Plant Disease Detection
- The user uploads a leaf/plant image (PNG/JPG up to 10 MB).
- **Hybrid pipeline:**
  1. The image bytes are passed to the **local ML model** (`DiseaseDetectionService`) which classifies the disease name, confidence, severity, and affected plant species.
  2. The ML result is appended as context to the `disease_prompt.txt` template and sent along with the raw image to **Gemini 1.5 Flash** (multimodal) via `GeminiVisionClient`.
  3. Gemini provides a detailed analysis, treatment steps, and preventive advice.
- If Gemini fails, the ML-only result is returned with a fallback message.
- Severity levels (High, Medium, Low, None) are colour-coded in the UI.

### 5.3 Smart Irrigation Scheduling
- Inputs: crop type, current soil moisture (%), temperature, humidity, rainfall, and crop growth stage.
- **Rule-based engine (`IrrigationService`):**
  - Retrieves the crop's base daily water requirement from a hardcoded crop-stage matrix (e.g., rice flowering: 12 mm/day).
  - Computes an Evapotranspiration (ET) adjustment factor from temperature and humidity.
  - Subtracts effective rainfall (80% of actual rainfall) from net water needs.
  - Compares current soil moisture against optimal thresholds per crop and stage.
  - Outputs: `irrigation_needed` (bool), `water_amount` (L/m²), schedule text, next irrigation date, and tips.
- **AI layer (`IrrigationAIService`):** Passes rule-based results as context to Groq for a farmer-friendly explanation.
- Response is persisted to the `irrigation_schedules` table.

### 5.4 Pest & Disease Control
- A dedicated `PestControl.jsx` page allows image upload for pest identification.
- The legacy `/pest-control` endpoint uses `PestPredictionService` to return: disease name, severity, confidence, `organic_solutions[]`, `chemical_solutions[]`, and `preventive_measures[]`.
- The new AI routes under `/api/ai/disease` also serve this purpose using `DiseaseAIService`.
- The UI includes a built-in "Read Aloud" button that serialises the result into a speech string and uses the browser's `SpeechSynthesisUtterance` API.

### 5.5 Track Farming
- Users register a farming record: crop name, location, soil type, fertilizer used, and planting date.
- Records are stored per-user in the `track_farming` database table.
- On-demand, the AI generates daily task advice using:
  - **`calculate_crop_age`**: Derives how many days since planting from today's date.
  - **`get_crop_stage`**: Maps age in days to a named growth stage using hardcoded crop calendars (Wheat, Rice, General crops).
  - **`get_mock_weather`**: Returns placeholder weather data (in production, this would call OpenWeatherMap).
  - The `tracking_prompt.txt` template is filled with all the above context and sent to Groq.
- The AI advice (including history) is saved to the `farming_advice` table.

### 5.6 AI Voice Assistant (Smart Talk)
- A floating chat widget (`VoiceAssistant.jsx`) accessible on every page.
- **Speech-to-Text:** Uses `webkitSpeechRecognition / SpeechRecognition` browser API. Detects spoken input and auto-submits the query.
- **Chat API:** Calls `POST /api/ai/smart-talk` with `{query, language, context}`. The `SmartTalkService` formats a conversation prompt and calls Groq, expecting a JSON response with `{"answer": "...", "options": [...]}`.
- **Text-to-Speech:** The bot's text answer is read aloud using `SpeechSynthesisUtterance`, selecting the appropriate `hi-IN` or `en-US` voice.
- Language toggle switches between English and Hindi in real time.
- Option chips (suggested follow-up questions) allow quick navigation.

### 5.7 Risk Alerts
- `GET /api/ai/risk-alerts` retrieves the authenticated user's farming records and applies season-specific alert rules.
- Season is automatically derived from the current month (June–September = Monsoon, October–March = Winter/Rabi, April–May = Summer/Zaid).
- Crop-specific alerts are generated (e.g., Stem Borer for rice in monsoon, Yellow Rust for wheat in winter).

### 5.8 Authentication System
- **Registration** (`POST /api/auth/register`): Validates uniqueness of email and username, hashes the password with bcrypt (cost 12), creates the user, and immediately returns a JWT — enabling auto-login on sign-up.
- **Login** (`POST /api/auth/login`): Validates credentials via `authenticate_user`, returns JWT valid for 7 days.
- **JWT Middleware:** The `get_current_active_user` FastAPI dependency decodes the Bearer token from the `Authorization` header or a fallback cookie, queries the user from DB, and injects the `User` object into protected route handlers.
- **Frontend Guard:** `AuthContext` manages the global `user` state. On mount, it checks `localStorage` for a token and calls `GET /api/auth/me`. `ProtectedRoute` wraps sensitive pages (e.g., Track Farming) and redirects unauthenticated users to `/login`.

---

## 6. Algorithms / Models Used

### 6.1 Crop Recommendation ML Model
- **File:** `models/crop_planning_brain.pkl` + `models/crop_label_encoder.pkl`
- **Type:** Scikit-learn classification model (likely Random Forest or similar ensemble, based on `predict_proba` usage with `joblib` serialisation).
- **Input features (7):** Nitrogen, Phosphorus, Potassium, Temperature, Humidity, pH, Rainfall.
- **Output:** Predicted crop label (decoded via `LabelEncoder`), confidence score, top-3 alternatives.
- **Fallback:** If the model file is absent, a rule-based heuristic using temperature, rainfall, pH, and nitrogen thresholds is activated.

### 6.2 Disease Detection ML Model
- **File:** Loaded by `DiseaseDetectionService` (path inferred from `models/` directory; likely a CNN-based `.pkl` or `.h5` file).
- **Type:** Image classification model (likely TensorFlow CNN or Scikit-learn with feature extraction — TensorFlow 2.18 is in requirements).
- **Input:** Raw image bytes decoded by Pillow.
- **Output:** `disease` (string label), `confidence` (float), `severity`, `affected_plant`.

### 6.3 Evapotranspiration (ET) Algorithm (Irrigation)
- A simplified Penman-Monteith derivative approach:
  - `ET_factor = (1 + (temp - 25) × 0.02) × (1 + (75 - humidity) × 0.005)`
  - Clamped to [0.5, 2.0] to prevent extreme values.
  - Applied to a crop-stage base water requirement to derive adjusted daily water need.
  - Effective rainfall deduction: `net_water = max(0, adjusted_req - rainfall × 0.8)`

### 6.4 Crop Stage Calculator (Tracking Logic)
- A lookup table of `(start_day, end_day, stage_name)` tuples per crop type.
- Crops included: Wheat (7 stages, 0–140 days), Rice (7 stages, 0–150 days), General (5 stages).
- `calculate_crop_age`: Date arithmetic from planting date to today.
- `get_crop_stage`: Binary search / linear scan over the stage table.

### 6.5 LLM: Groq — Llama 3.1 8B Instant
- **Model ID:** `llama-3.1-8b-instant`
- **Temperature:** 0.7 (balanced creativity and consistency)
- **Max tokens:** 1024
- **Usage:** Crop suggestions, irrigation advice, Smart Talk conversations, farm tracking advice.
- **Input:** Structured text prompt + system instruction. Language appended to the system prompt.
- **Output:** Free-form text or JSON, cleaned via regex if markdown-wrapped.

### 6.6 Gemini 1.5 Flash (Multimodal Vision)
- **Model:** `gemini-1.5-flash`
- **Usage:** Disease and pest image analysis.
- **Input:** PIL Image object + text prompt with ML context.
- **Output:** Textual disease analysis with treatment and prevention advice.

### 6.7 Rule-Based Fallback System
A three-tier offline safety net:
1. **Crop fallback:** Returns crops by Indian season (Kharif → Rice, Maize, Cotton; Rabi → Wheat, Mustard, Gram; Zaid → Watermelon, Cucumber, Moong Dal). Supports Hindi season names via a transliteration map.
2. **Disease fallback:** Returns a simple message advising the farmer to consult a local expert.
3. **Irrigation fallback:** Returns generic advice to maintain moderate soil moisture and avoid overwatering during flowering.

---

## 7. APIs & Integrations

### 7.1 External APIs

| API | Provider | Purpose | Auth Method |
|---|---|---|---|
| Chat Completions | Groq Cloud | LLM text generation (Llama 3.1 8B) | `GROQ_API_KEY` env var |
| Generate Content | Google AI (Gemini) | Vision-language image analysis | `GEMINI_API_KEY` env var |

### 7.2 Internal REST API Endpoints

#### Authentication (`/api/auth/*`)
| Method | Path | Auth Required | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account; returns JWT + user info |
| POST | `/api/auth/login` | No | Authenticate; returns JWT + user info |
| POST | `/api/auth/logout` | No | Stateless (client removes token) |
| GET | `/api/auth/me` | Yes (Bearer) | Get current user profile |

#### AI Features (`/api/ai/*`)
| Method | Path | Auth Required | Description |
|---|---|---|---|
| POST | `/api/ai/crop-suggestion` | No | Location-based AI crop recommendation |
| POST | `/api/ai/irrigation` | No | AI-enhanced irrigation advice |
| POST | `/api/ai/disease?language=en` | No | Hybrid ML+Gemini disease detection |
| POST | `/api/ai/smart-talk` | Yes (Bearer) | Conversational farming assistant |
| POST | `/api/ai/track-farming` | Yes (Bearer) | Create farming record |
| GET | `/api/ai/track-farming` | Yes (Bearer) | List all farming records for user |
| POST | `/api/ai/track-farming/{id}/advice` | Yes (Bearer) | Get AI advice for a farming record |
| GET | `/api/ai/risk-alerts` | Yes (Bearer) | Get seasonal risk alerts for user's crops |

#### Legacy ML Endpoints (`/`)
| Method | Path | Description |
|---|---|---|
| POST | `/predict-crop` | Direct ML model crop prediction |
| POST | `/predict-disease` | Direct ML model disease detection |
| POST | `/irrigation-schedule` | Rule-based irrigation schedule |
| POST | `/pest-control` | Pest identification and control recommendations |
| GET | `/health` | Backend health check |
| GET | `/crop-patterns` | Historical crop pattern data |
| GET | `/farmer-insights` | Aggregated seasonal insights |

---

## 8. Database / Data Handling

### Database Type
- **Development:** SQLite (`mittimantra.db`, zero-config, file-based)
- **Production:** PostgreSQL (configurable via the `DATABASE_URL` environment variable; `psycopg2-binary` driver included)

### Schema

#### `users` Table
| Column | Type | Constraints |
|---|---|---|
| id | Integer | PK, auto-increment |
| email | String | Unique, Not Null, Indexed |
| username | String | Unique, Not Null, Indexed |
| full_name | String | Nullable |
| hashed_password | String | Not Null (bcrypt hash) |
| is_active | Boolean | Default True |
| is_admin | Boolean | Default False |
| created_at | DateTime | Server default (now) |
| updated_at | DateTime | Auto-update on change |

#### `crop_predictions` Table
Stores each crop recommendation request and response: NPK values, temperature, humidity, pH, rainfall, recommended crop, confidence score, alternative crops (JSON string), and reasoning text.

#### `disease_predictions` Table
Stores disease detection results: disease label, confidence, severity, affected plant, and optional image path.

#### `irrigation_schedules` Table
Stores irrigation requests and outcomes: crop type, soil moisture, temperature, humidity, rainfall, stage, irrigation needed flag, water amount, schedule text, next irrigation time, and reasoning.

#### `track_farming` Table
Stores farming records per user: crop name, location, soil type, fertilizer, planting date, last advice date, and preferred language.

#### `farming_advice` Table
Stores AI advice history linked to a farming record: advice text and creation timestamp.

### Data Flow
1. User → Frontend form → `POST /api/ai/*`
2. FastAPI → Pydantic validation → Service Layer
3. Service Layer → ML inference + LLM call
4. Result → SQLAlchemy ORM → `db.add()` → `db.commit()` → persisted to SQLite/PostgreSQL
5. Subsequent GET requests return stored data ordered by `created_at DESC`

---

## 9. Execution Flow

### End-to-End Crop Recommendation Flow

```
[User fills form: N, P, K, temp, humidity, pH, rainfall]
         │
         ▼
[CropRecommendation.jsx] → POST /api/ai/crop-suggestion
         │
         ▼
[api_auth_routes validates JWT] → get_current_active_user (if auth required)
         │
         ▼
[ai_routes.py: get_crop_suggestion()]
  → load_prompt("crop_prompt.txt")
  → Construct dynamic prompt string with location, season, NPK data
         │
         ▼
[AIOrchestrator.get_llm_response()]
  → Appends language instruction to system_prompt.txt
  → GroqClient.get_completion(prompt, system_instruction)
  → Groq API call: model="llama-3.1-8b-instant", temp=0.7
         │
         ▼
[Parse LLM JSON response]
  → regex/json.loads to extract crop_name list
  → recommended_crop = first item; alternatives = rest
         │
         ▼  (on failure)
[RuleBasedFallbacks.get_crop_fallback(location, season, lang)]
         │
         ▼
[Return JSON]: {recommended_crop, alternative_crops, ai_advice, language}
         │
         ▼
[Frontend renders results with Framer Motion animations]
```

### Authentication Flow

```
[User submits login form]
         │
         ▼
[AuthContext.login()] → POST /api/auth/login {username, password}
         │
         ▼
[authenticate_user()] → DB query → verify_password (bcrypt)
         │
         ▼
[create_access_token()] → JWT (HS256, 7-day expiry, sub=username)
         │
         ▼
[Response]: {access_token, token_type, user}
         │
         ▼
[localStorage.setItem('token', access_token)]
[setUser(data.user)] → AuthContext updates globally
         │
         ▼
[navigate('/')] → React Router redirect to Home
```

---

## 10. Setup & Installation

### Prerequisites
- Python 3.8+ with pip
- Node.js 16+ with npm

### Step 1 — Clone the Repository
```bash
git clone <repository-url>
cd Mittimantra-main
```

### Step 2 — Backend Setup
```bash
cd mittimantra_backend

# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 3 — Configure Backend Environment Variables
Create a `.env` file inside `mittimantra_backend/`:
```env
DATABASE_URL=sqlite:///./mittimantra.db
SECRET_KEY=your-strong-secret-key-change-in-production
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_google_gemini_api_key_here
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Step 4 — Initialise the Database
```bash
# From mittimantra_backend directory:
python init_db.py
# OR simply start the server once; SQLAlchemy creates tables on startup.
```

### Step 5 — Start the Backend Server
```bash
# From mittimantra_backend directory:
uvicorn app.main:app --reload
# Backend will be available at: http://127.0.0.1:8000
# Swagger API docs at: http://127.0.0.1:8000/docs
```

### Step 6 — Frontend Setup
```bash
cd ../mittimantra_frontend

# Install dependencies
npm install

# Optional: create .env file for custom API URL
echo "VITE_API_URL=http://localhost:8000" > .env
```

### Step 7 — Start the Frontend Dev Server
```bash
npm run dev
# App available at: http://localhost:5173
```

### Accessing the Application
- Open `http://localhost:5173` in a browser.
- Register a new account or log in.
- Use the Voice Assistant (floating robot icon, bottom-right) for hands-free interaction.

---

## 11. Challenges & Assumptions

### Challenges

1. **ML Model File Dependency:** The core crop and disease ML models (`crop_planning_brain.pkl`, etc.) are not committed to the repository (listed in `.gitignore`). The backend gracefully degrades to rule-based fallbacks when these files are absent, but full accuracy requires the model files to be present in the `models/` directory.

2. **LLM Response Variability:** LLM outputs are not always well-structured JSON. The crop suggestion endpoint uses multi-layered parsing: first `json.loads` on cleaned text, then a regex fallback (`re.findall`) to extract crop names, and finally a hardcoded rule-based response.

3. **Real-Time Weather Data:** The `get_mock_weather()` function in `tracking_logic.py` returns hardcoded placeholder weather data. Integrating a live weather API (e.g., OpenWeatherMap) is stubbed but not yet implemented.

4. **Disease AI Service Bug:** In `disease_ai_service.py`, the variables `disease`, `plant`, and `severity` are referenced in the return statement without being assigned from `ml_result` fields (likely a development oversight). This means the endpoint may raise a `NameError` in production unless the outer `except` clause catches it.

5. **Groq JSON Mode Not Implemented:** The `AIOrchestrator.get_llm_response()` accepts a `json_mode` parameter but does not pass it to `GroqClient.get_completion()`. The Groq client does not enforce structured output; JSON reliability depends entirely on prompt engineering.

6. **Track Farming Key Mismatch:** In `track_farming_service.py`, the record creation uses `data.get("plantation_date")` while the Pydantic request model (`TrackFarmingCreate`) defines the field as `planting_date`. This discrepancy would cause a `None` value on datetime parsing, raising a `TypeError`.

7. **Security Consideration:** JWT tokens are stored in `localStorage`, making them accessible to JavaScript. For production deployments, `HttpOnly` cookie storage is recommended to prevent XSS theft.

### Assumptions

- The system targets **Indian farmers**, with locale-specific crop calendars (Kharif, Rabi, Zaid seasons) and currency/market prices in INR.
- It is assumed that users with a smartphone or basic computer and internet access can operate the web interface.
- The disease detection ML model is a CNN trained on the **PlantVillage dataset** or a similar standard agricultural image dataset (inferred from TensorFlow dependency and disease label schema).
- The application assumes that image inputs for disease/pest detection are of reasonable quality (well-lit, in-focus leaf photographs).
- Soil nutrient values (N, P, K) are expected in `kg/ha` units without explicit unit normalisation beyond model-internal preprocessing.

---

## 12. Future Improvements

### High Priority
1. **Real Weather API Integration:** Replace `get_mock_weather()` with a live call to OpenWeatherMap or IMD (India Meteorological Department) API to provide location-accurate weather context for Track Farming advice.
2. **Fix `disease_ai_service.py` Variable Scope Bug:** Assign `disease`, `plant`, and `severity` from `ml_result` before the return dictionary.
3. **Fix `track_farming_service.py` Field Name Mismatch:** Align `plantation_date` / `planting_date` keys between Pydantic model and service.
4. **Secure Token Storage:** Migrate JWT from `localStorage` to `HttpOnly` secure cookies for production deployments.

### Feature Enhancements
5. **Progressive Web App (PWA):** Add service workers and a manifest so farmers can install the app on low-cost Android phones and use it offline in areas with poor connectivity.
6. **Market Price Integration:** Connect to AGMARKNET or eSNAM APIs to show real-time mandi prices for recommended crops.
7. **Image Capture via Camera:** Integrate `getUserMedia` on mobile for direct camera capture instead of file upload only.
8. **Farm Map / GIS Layer:** Allow users to plot farm boundaries on a map view (Google Maps / Leaflet.js) and analyse zone-specific recommendations.
9. **SMS/WhatsApp Alerts:** Integrate Twilio or MSG91 to push risk alerts and daily farming reminders to farmers who may not open the app every day.
10. **Multilingual Expansion:** Extend language support beyond English and Hindi to include Punjabi, Marathi, Telugu, and Tamil — covering higher farmer populations.

### ML / AI Improvements
11. **Model Versioning with MLflow:** Track ML model experiments and deploy improved models without downtime.
12. **Fine-Tuned Agricultural LLM:** Fine-tune or use a domain-specific model (e.g., KrishiGPT) for more accurate and contextually relevant advice compared to a general-purpose model.
13. **Active Learning Pipeline:** Collect corrected user feedback on predictions to continuously improve the disease detection model.
14. **Groq JSON Mode Enforcement:** Pass `response_format={"type": "json_object"}` in the Groq API call and propagate `json_mode=True` through the orchestrator to reduce response parsing failures.

### Infrastructure
15. **Database Migration to PostgreSQL:** For multi-user production deployments, replace SQLite with a managed PostgreSQL instance (Render DB, Supabase, or Neon.tech) to support concurrent writes.
16. **Redis Caching:** Cache frequent AI responses (e.g., seasonal crop suggestions for the same location) to reduce Groq API costs and improve response latency.
17. **Rate Limiting:** Add FastAPI middleware (e.g., `slowapi`) to prevent API abuse on AI endpoints.
18. **Automated CI/CD Pipeline:** Set up GitHub Actions to run tests, lint checks, and auto-deploy to Render on every merge to `main`.

---

*Generated on 2026-04-20 | Based on complete source code analysis of the Mitti Mantra repository.*
