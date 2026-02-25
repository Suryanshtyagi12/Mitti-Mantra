# 🚀 Quick Start Guide - Mitti Mantra

Complete setup guide for both Backend and Frontend

---

## 📦 STEP 1: Backend Setup

### Navigate to Backend Directory
```bash
cd mittimantra_backend
```

### Activate Virtual Environment
```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### Install Missing Dependencies
```bash
pip install xgboost
pip install --upgrade scikit-learn
```

### Verify Installation
```bash
python -c "import xgboost; print('XGBoost:', xgboost.__version__)"
python -c "import sklearn; print('Scikit-learn:', sklearn.__version__)"
```

### Start Backend Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Backend will be running at:** `http://localhost:8000`

**Check health:** `http://localhost:8000/health`

**API docs:** `http://localhost:8000/docs`

---

## 🎨 STEP 2: Frontend Setup

### Open New Terminal Window

### Navigate to Frontend Directory
```bash
cd mittimantra_frontend
```

### Install Dependencies
```bash
npm install
```

### Create Environment File
```bash
# Copy the example file
cp .env.example .env
```

### Edit .env File
Open `.env` and verify:
```env
VITE_API_URL=http://localhost:8000
```

### Start Frontend Development Server
```bash
npm run dev
```

**Frontend will be running at:** `http://localhost:3000`

---

## ✅ STEP 3: Test the Application

### Open Browser
Navigate to: `http://localhost:3000`

### Test Features:

1. **Crop Recommendation**
   - Go to "Crop Recommendation"
   - Fill in sample data:
     - Nitrogen: 90
     - Phosphorus: 42
     - Potassium: 43
     - Temperature: 20.8
     - Humidity: 82
     - pH: 6.5
     - Rainfall: 202
   - Click "Get Recommendation"

2. **Disease Detection**
   - Go to "Disease Detection"
   - Upload a plant leaf image
   - Click "Detect Disease"

3. **Irrigation Scheduler**
   - Go to "Irrigation"
   - Select crop and enter data
   - Get smart irrigation schedule

4. **Pest Control**
   - Go to "Pest Control"
   - Upload affected plant image
   - Get treatment recommendations

---

## 🐛 Common Issues & Solutions

### Backend Issues:

**Problem:** `ModuleNotFoundError: No module named 'xgboost'`
```bash
Solution:
pip install xgboost
```

**Problem:** Scikit-learn version mismatch warning
```bash
Solution:
pip install --upgrade scikit-learn
```

**Problem:** Port 8000 already in use
```bash
Solution:
uvicorn app.main:app --reload --port 8001
# Update frontend .env: VITE_API_URL=http://localhost:8001
```

### Frontend Issues:

**Problem:** CORS errors in browser console
```bash
Solution:
1. Ensure backend is running
2. Check CORS is enabled in backend main.py
3. Verify VITE_API_URL in .env file
```

**Problem:** `npm install` fails
```bash
Solution:
rm -rf node_modules package-lock.json
npm install
```

**Problem:** Port 3000 already in use
```bash
Solution:
# Vite will automatically use port 3001 if 3000 is busy
# Or manually set port in vite.config.js
```

---

## 📁 Project Structure Overview

```
mittimantra/
│
├── mittimantra_backend/          # FastAPI Backend
│   ├── app/
│   │   ├── main.py              # API endpoints
│   │   ├── models/              # Pydantic models
│   │   ├── services/            # ML services
│   │   └── utils/               # Helper functions
│   ├── models/                  # ML model files (.pkl, .keras)
│   ├── venv/                    # Python virtual environment
│   └── requirements.txt
│
└── mittimantra_frontend/       # React Frontend
    ├── src/
    │   ├── components/          # Reusable components
    │   ├── pages/               # Page components
    │   ├── services/            # API service
    │   ├── App.jsx
    │   └── main.jsx
    ├── public/                  # Static assets
    └── package.json
```

---

## 🔥 Development Workflow

### Terminal 1 (Backend):
```bash
cd mittimantra_backend
venv\Scripts\activate  # Windows
uvicorn app.main:app --reload
```

### Terminal 2 (Frontend):
```bash
cd mittimantra_frontend
npm run dev
```

### Make Changes:
- Backend changes auto-reload (--reload flag)
- Frontend hot-reloads automatically
- Check browser console for errors

---

## 🚀 Production Deployment

### Backend:
```bash
cd mittimantra_backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend:
```bash
cd mittimantra_frontend
npm run build
# Deploy 'dist' folder to Vercel/Netlify
```

---

## 📊 API Testing

### Using cURL:

**Health Check:**
```bash
curl http://localhost:8000/health
```

**Crop Prediction:**
```bash
curl -X POST http://localhost:8000/predict-crop \
  -H "Content-Type: application/json" \
  -d '{
    "nitrogen": 90,
    "phosphorus": 42,
    "potassium": 43,
    "temperature": 20.8,
    "humidity": 82,
    "ph": 6.5,
    "rainfall": 202
  }'
```

**Disease Detection:**
```bash
curl -X POST http://localhost:8000/predict-disease \
  -F "file=@/path/to/leaf.jpg"
```

---

## 🎯 Next Steps

1. ✅ Backend running
2. ✅ Frontend running
3. ✅ Test all features
4. 📝 Add user authentication (optional)
5. 🗄️ Add database (optional)
6. 🚀 Deploy to production

---

## 📧 Need Help?

- Check documentation in README files
- Review API docs at http://localhost:8000/docs
- Open an issue on GitHub
- Email: [EMAIL_ADDRESS]

---

**Happy Farming! 🌾**
