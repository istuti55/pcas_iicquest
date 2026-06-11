# Pālo: Smart Queue Management

Pālo is a premium, real-time queue management system designed to eliminate physical waiting. It combines a stunning "Vanguard" glassmorphism aesthetic with powerful logic, including machine-learning wait predictions and automated SMS notifications.

## 🌟 The Experience

### 🎟️ For Clients (The User Portal)
Clients can join a queue from anywhere using their mobile device. 
- **Digital Tokens**: Get a personalized token with a unique verification PIN.
- **Live Tracking**: See your real-time position in the queue, total people waiting, and an AI-calculated "estimated wait time".
- **Self-Service Retrieval**: Lost your session? Easily find your active ticket using your phone number and PIN.
- **Reporting Times**: The system automatically assigns suggested reporting times based on daily service limits.

### 🛡️ For Staff (The Admin Console)
A powerful command center for office operators to manage flow and maintain efficiency.
- **Live Workspace**: Call the next person in line, mark no-shows, and complete services with a single click.
- **Dynamic Control**: Pause or resume token generation globally, or for specific dates (e.g., holidays or maintenance days).
- **Service Analytics**: Monitor live stats like tokens served today, average wait times, and system health.
- **Priority Management**: Track verification PINs to ensure only valid ticket holders are served.

## 🧠 Smart Core Logic
- **ML Engine**: Uses a Gradient Boosting Regressor to predict wait times based on historical data, time of day, and current queue depth.
- **SMS System**: Integrates with Infobip to send booking confirmations and proactive "turn is near" reminders (approx. 60-120 minutes out).
- **Automatic Reset**: Each queue resets token numbering daily for a fresh start at 10:00 AM.
- **Risk Scoring**: Identifies "reliable" vs "high-risk" users based on past attendance, requiring SMS confirmation for unreliable profiles.

## 🛠️ Technology Stack
- **Frontend**: React (Vite) + Tailwind CSS + Lucide Icons + Framer Motion (Animations).
- **Backend**: FastAPI (Python) + SQLAlchemy ORM (SQLite).
- **Predictive Engine**: Scikit-Learn + NumPy.

## 🚀 Getting Started

### Backend Setup
1. `cd backend`
2. `python -m venv venv` and activate it (`.\venv\Scripts\activate` on Windows).
3. `pip install -r requirements.txt`
4. `uvicorn main:app --reload` (Runs on `http://localhost:8000`)

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. `npm run dev` (Runs on `http://localhost:5173`)

---
**Pālo** · Smart. Simple. Fast.
