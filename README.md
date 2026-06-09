# Personal Learning Tracker

A starter full-stack app for tracking learning sessions, todos, and progress.

Tech stack:
- React + Tailwind CSS
- FastAPI
- PostgreSQL

## Structure

- `frontend/` — React + Vite + Tailwind
- `backend/` — FastAPI app with SQLAlchemy and PostgreSQL

## Setup

Frontend:
1. `cd frontend`
2. `npm install`
3. `npm run dev`

Backend:
1. `cd backend`
2. `pip install -r requirements.txt`
3. `uvicorn app.main:app --reload`

## Notes

Use `backend/.env.example` to configure a PostgreSQL connection string.
