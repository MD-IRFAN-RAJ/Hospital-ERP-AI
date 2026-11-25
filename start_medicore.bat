@echo off
echo ===================================================
echo Starting MediCore AI-Powered Hospital ERP System
echo ===================================================

echo [1/3] Starting Python FastAPI AI Microservice on Port 8000...
start "MediCore AI Service (Port 8000)" cmd /k "cd ai-service && python -m uvicorn app.main:app --port 8000 --reload"

echo [2/3] Starting Node.js Express ERP Backend on Port 5000...
start "MediCore Backend API (Port 5000)" cmd /k "cd backend && npm run dev"

echo [3/3] Starting React Vite Frontend on Port 5173...
start "MediCore React Frontend (Port 5173)" cmd /k "cd frontend && npm run dev"

echo.
echo All services are launching!
echo Once running, open your web browser at:
echo http://localhost:5173
echo.
pause

