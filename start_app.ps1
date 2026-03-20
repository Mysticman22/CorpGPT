# NEXUS Startup Script
# Checks Docker is running before starting services

Write-Host "`n=== NEXUS Startup ===" -ForegroundColor Cyan

# 1. Start Backend
Write-Host "`nStep 2: Starting Backend (FastAPI)..." -ForegroundColor Yellow
$backendCommand = "cd '$PSScriptRoot\backend'; if (Test-Path 'venv\Scripts\Activate.ps1') { .\venv\Scripts\Activate.ps1 } else { Write-Host 'ERROR: venv not found! Run: python -m venv venv && pip install -r requirements.txt' -ForegroundColor Red; Pause; exit }; uvicorn app.main:app --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand

# 2. Start Frontend
Write-Host "`nStep 2: Starting Frontend (React/Vite)..." -ForegroundColor Yellow
$frontendCommand = "cd '$PSScriptRoot\frontend'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCommand

Write-Host @"

=== All services launched! ===

  Backend  : http://localhost:8000
  Frontend : http://localhost:5173
  API Docs : http://localhost:8000/docs

  Wait a few seconds for both servers to fully start, then open the frontend URL.

"@ -ForegroundColor Green
