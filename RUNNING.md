# How to Run NEXUS

## Prerequisites
- **Docker Desktop** installed and running
- **Python 3.10+** with a virtual environment set up in `backend/venv/`
- **Node.js 18+** installed

## Quick Start (Recommended)

> [!IMPORTANT]
> **Start Docker Desktop first** — open it from the Start Menu and wait for the whale icon in the taskbar to stop animating before running the script.

```powershell
.\start_app.ps1
```

This automatically:
1. Checks Docker is running
2. Starts PostgreSQL, MongoDB, Redis containers
3. Starts the FastAPI backend on `http://localhost:8000`
4. Starts the React frontend on `http://localhost:5173`

---

## Manual Setup (First Time)

### 1. Start Databases (Docker)
```powershell
docker-compose up -d
```

### 2. Set Up Backend (first time only)
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 3. Start Backend
```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```
Backend runs at `http://localhost:8000` — API docs at `http://localhost:8000/docs`

### 4. Start Frontend
```powershell
cd frontend
npm install   # first time only
npm run dev
```
Frontend runs at `http://localhost:5173`

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| "Cannot reach server" in signup/login | Backend is not running — check the backend terminal for errors |
| Docker error on startup | Open Docker Desktop and wait for it to fully start |
| `DATABASE_URL is not set` | Make sure `backend/.env` exists (it should already be there) |
| `uvicorn: command not found` | Activate the venv first: `.\venv\Scripts\Activate.ps1` |
| Port 5432 already in use | Another PostgreSQL is running — stop it or change the port in `docker-compose.yml` |

---

## Architecture

```
Frontend (React/Vite)  →  http://localhost:5173
        ↓ API calls to http://localhost:8000/api
Backend (FastAPI)      →  http://localhost:8000
        ↓
PostgreSQL             →  localhost:5432  (Docker)
MongoDB                →  localhost:27017 (Docker)
Redis                  →  localhost:6379  (Docker)
```
