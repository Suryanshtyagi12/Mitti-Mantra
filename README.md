# Mitti Mantra 🌾

**AI-Powered Agricultural Decision Support System**

Mitti Mantra is a comprehensive web application that empowers farmers with intelligent, data-driven recommendations for crop selection, disease detection, irrigation scheduling, and pest control. Built with modern technologies and machine learning, it bridges the gap between traditional farming and precision agriculture.

---

## 🌟 Features

### 🌱 Core Agricultural Services

1. **Crop Recommendation System**
   - AI-powered suggestions based on soil nutrients (N, P, K)
   - Weather and environmental factor analysis
   - Optimal crop selection for maximum yield

2. **Disease Detection**
   - Image-based plant disease identification
   - Upload leaf photos for instant analysis
   - Treatment and prevention recommendations

3. **Smart Irrigation Scheduling**
    - Intelligent water management system
    - AI-enhanced crop-specific irrigation plans
    - Real-time soil moisture analysis
    - Location-aware weather integration

4. **Track Farming (New!)**
    - Create and manage personalized farming plans
    - Capture crop details, location, and soil types
    - Get AI-driven daily task recommendations
    - Monitor historical farming records and progress

5. **AI Voice Assistant**
    - Conversational "Smart Talk" farming assistant
    - Multilingual support (Hindi, English, etc.)
    - Voice-first interaction for ease of use in the field
    - Context-aware agricultural insights

6. **Pest & Disease Control**
    - Image-based identification (Groq/Gemini powered)
    - Organic and chemical control solutions
    - Preventive measures and best practices

7. **Analytics Dashboard**
    - Track farming decisions and patterns
    - Historical data analysis
    - Visual insights and reports

### 🔐 User Authentication

- Secure JWT-based authentication
- User registration and login
- Protected routes for personalized features
- Session management with token storage

---

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- **React 18** - Modern UI library
- **React Router v6** - Client-side routing
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Axios** - HTTP client
- **React Toastify** - Toast notifications
- **React Icons** - Icon library

**Backend:**
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **SQLite** - Lightweight database
- **Passlib + Bcrypt** - Password hashing
- **Python-JOSE** - JWT token management
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

**Machine Learning:**
- Scikit-learn compatible models
- Image processing capabilities
- Custom prediction services

### Project Structure

```
Mittimantra/
├── mittimantra_backend/          # FastAPI backend
│   ├── app/
│   │   ├── main.py              # Application entry point
│   │   ├── auth.py              # Authentication utilities
│   │   ├── database.py          # Database configuration
│   │   ├── db_models.py         # SQLAlchemy models
│   │   ├── routes/
│   │   │   ├── api_auth_routes.py # JSON API auth
│   │   │   ├── ai_routes.py     # AI feature endpoints (New!)
│   │   │   └── auth_routes.py   # HTML form auth (legacy)
│   │   ├── services/
│   │   │   ├── ai_orchestrator.py # AI LLM management
│   │   │   ├── crop_ai_service.py # Enhanced crop AI
│   │   │   ├── disease_ai_service.py # AI disease detection
│   │   │   ├── irrigation_ai_service.py # Smart irrigation AI
│   │   │   ├── track_farming_service.py # Farm records mgmt
│   │   │   ├── smart_talk_service.py # Conversational AI
│   │   │   └── ...              # Other core services
│   │   └── models/              # Request/Response models
│   ├── static/                  # Static assets
│   ├── requirements.txt
│   └── .env
│
└── mittimantra_frontend/         # React frontend
    ├── src/
    │   ├── App.jsx              # Main app component
    │   ├── components/
    │   │   ├── VoiceAssistant/  # Interactive voice UI
    │   │   └── ...
    │   ├── pages/
    │   │   ├── TrackFarming.jsx # Farm activity hub
    │   │   ├── DiseaseDetection.jsx
    │   │   └── ...
    │   └── services/
    │       └── api.js           # API client
    └── ...
```

---

## 🚀 Getting Started

### Prerequisites

**Backend:**
- Python 3.8+
- pip (Python package manager)

**Frontend:**
- Node.js 16+
- npm or yarn

### Installation

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd Mittimantra
```

#### 2. Backend Setup

```bash
# Navigate to backend directory
cd mittimantra_backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
# Copy the example below and save as .env
```

**Backend `.env` file:**
```env
DATABASE_URL=sqlite:///./mittimantra.db
SECRET_KEY=your-secret-key-here-change-in-production
```

**Initialize Database:**
```bash
# Run the application once to create tables
uvicorn app.main:app --reload
# Press Ctrl+C to stop after initialization
```

#### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../mittimantra_frontend

# Install dependencies
npm install

# Create .env file (optional)
# VITE_API_URL=http://localhost:8000
```

---

## 🎮 Running the Application

### Development Mode

**You need TWO terminal windows:**

**Terminal 1 - Backend:**
```bash
cd mittimantra_backend
uvicorn app.main:app --reload
```
✅ Backend API running at: `http://127.0.0.1:8000`

**Terminal 2 - Frontend:**
```bash
cd mittimantra_frontend
npm run dev
```
✅ React app running at: `http://localhost:3000` (or `http://localhost:5173`)

### Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

**🎯 Important:** Always use the **frontend URL** (port 3000 or 5173), NOT the backend URL (port 8000).

---

## 🔑 Authentication Flow

### Registration
1. Navigate to `/register`
2. Fill in email, username, password, and optional full name
3. Submit form
4. **Automatic redirect** to Home page (`/`)
5. User is logged in with JWT token stored in localStorage

### Login
1. Navigate to `/login`
2. Enter username and password
3. Submit form
4. **Automatic redirect** to Home page (`/`)
5. JWT token stored in localStorage

### Logout
1. Click "Logout" button in navbar
2. Token removed from localStorage
3. **Automatic redirect** to `/login`

### Protected Routes
- `/dashboard` requires authentication
- Unauthenticated users automatically redirected to `/login`
- All other routes are public

---

## 📡 API Documentation

### Base URL
```
http://localhost:8000
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securepass123",
  "full_name": "John Doe"  // optional
}

Response (201):
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "securepass123"
}

Response (200):
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <access_token>

Response (200):
{
  "id": 1,
  "username": "johndoe",
  "email": "user@example.com",
  "full_name": "John Doe",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00"
}
```

#### Logout
```http
POST /api/auth/logout

Response (200):
{
  "message": "Logged out successfully"
}
```

### Agricultural Services

#### Crop Prediction
```http
POST /predict-crop
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "nitrogen": 90,
  "phosphorus": 42,
  "potassium": 43,
  "temperature": 20.87,
  "humidity": 82.0,
  "ph": 6.5,
  "rainfall": 202.9
}
```

#### Disease Detection
```http
POST /predict-disease
Content-Type: multipart/form-data
Authorization: Bearer <access_token>

file: <image_file>
```

#### Irrigation Schedule
```http
POST /irrigation-schedule
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "crop_type": "rice",
  "soil_moisture": 45.0,
  "temperature": 28.5,
  "humidity": 75.0,
  "rainfall": 10.0,
  "crop_stage": "vegetative"
}
```

### 🤖 AI-Enhanced Features (New /api/ai Routes)

#### AI Crop Suggestion (Location-Based)
```http
POST /api/ai/crop-suggestion
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "location": "Punjab, India",
  "season": "Kharif",
  "priority": "Profit",
  "soil_type": "Alluvial",
  "language": "hi"  // hi, en, etc.
}
```

#### Smart Talk (Conversational AI)
```http
POST /api/ai/smart-talk
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "query": "How can I improve my wheat yield?",
  "language": "en"
}
```

#### Track Farming (Add Record)
```http
POST /api/ai/track-farming
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "crop_name": "Wheat",
  "location": "Sonipat",
  "soil_type": "Loamy",
  "fertilizer": "Urea",
  "planting_date": "2024-11-20"
}
```

#### Get Farming Advice
```http
POST /api/ai/track-farming/{record_id}/advice
Authorization: Bearer <access_token>
```

---

## 🎨 Frontend Architecture

### State Management

**AuthContext** (`src/context/AuthContext.jsx`)
- Manages authentication state globally
- Provides `login()`, `register()`, `logout()` functions
- Handles token storage and retrieval
- Auto-fetches user profile on mount
- Manages navigation after auth actions

### Routing

**App.jsx** uses React Router v6 with nested routes:
- Auth routes (`/login`, `/register`) rendered without layout
- Main routes wrapped in `<Layout>` (with navbar/footer)
- Protected routes use `<ProtectedRoute>` wrapper
- Automatic redirects based on auth state

### API Integration

**api.js** (`src/services/api.js`)
- Centralized Axios instance
- Automatic JWT token injection via interceptor
- Base URL configuration
- Error handling and 401 redirect

---

## 🛡️ Security Features

### Backend
- ✅ Password hashing with bcrypt (cost factor 12)
- ✅ JWT tokens with configurable expiration (7 days default)
- ✅ CORS configured for specific origins
- ✅ SQL injection prevention via SQLAlchemy ORM
- ✅ Input validation with Pydantic schemas
- ✅ Password length limits for bcrypt compatibility

### Frontend
- ✅ JWT stored in localStorage (development) or HttpOnly cookies (production)
- ✅ Token sent in Authorization header
- ✅ Protected routes with auth checks
- ✅ Automatic logout on 401 responses
- ✅ Form validation before submission

---

## 🧪 Testing

### Backend Testing
```bash
cd mittimantra_backend

# Test authentication
python test_auth_flow.py

# Manual API testing
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"test123"}'
```

### Frontend Testing
1. Start both servers (backend + frontend)
2. Test registration flow
3. Test login flow
4. Test protected route access
5. Test logout
6. Verify automatic redirects

---

## 🐛 Troubleshooting

### Issue: Frontend not redirecting after login
**Solution:** Make sure you're accessing the React app (port 3000/5173), NOT the backend (port 8000)

### Issue: CORS errors
**Solution:** Verify `allow_origins` in `main.py` includes your frontend URL

### Issue: 503 errors on ML endpoints
**Solution:** ML models not loaded. This is expected if model files are missing. Services gracefully fail.

### Issue: Token not being sent
**Solution:** Check localStorage for `token` key. Verify API interceptor in `api.js`

### Issue: Database locked errors
**Solution:** Close all connections to SQLite database and restart backend

---

## 📦 Deployment

### Backend Deployment

**Recommended: Render, Railway, or Heroku**

1. Set environment variables:
   ```
   DATABASE_URL=<production_database_url>
   SECRET_KEY=<strong_random_secret>
   ```

2. Update CORS origins in `main.py`

3. Use production ASGI server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

### Frontend Deployment

**Recommended: Vercel, Netlify, or Cloudflare Pages**

1. Update `VITE_API_URL` to production backend URL

2. Build production bundle:
   ```bash
   npm run build
   ```

3. Deploy `dist/` folder

---

## 👥 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Email: support@mittimantra.com

---

## 🙏 Acknowledgments

- Machine learning models powered by Scikit-learn
- UI design inspired by modern agricultural tech platforms
- Icons from React Icons library
- Weather data integration (future enhancement)

---

**Built with ❤️ for farmers by the Mitti Mantra team**
