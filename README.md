# Pālo Queue Management

A real-time queue management system with ML-powered wait time prediction.

## Project Structure

```
palo-queue-management/
├── backend/    # FastAPI + SQLAlchemy + scikit-learn
└── frontend/   # Vite + React + TypeScript + Tailwind CSS v4
```

## Quick Start

### Backend
```bash
cd backend
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs: `http://localhost:8000/docs`

### Frontend
```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

> The frontend dev server proxies `/api` requests to the backend on port 8000.

## Features

- 🎟️ **Token system** — customers receive numbered tokens when joining
- ⏱️ **ML wait prediction** — scikit-learn model estimates wait times based on hour, day, and queue depth
- 📺 **Display board** — full-screen lobby monitor view
- 🖥️ **Operator dashboard** — staff panel to call, serve, and complete tokens
- 📊 **Real-time stats** — live queue statistics with auto-refresh

## See Also
- [`backend/README.md`](backend/README.md) — Backend setup & API reference
- [`frontend/README.md`](frontend/README.md) — Frontend setup & structure
