# Run the Frontend
cd frontend
npm run dev

# Run the Backend
cd backend
.\venv\Scripts\Activate
uvicorn app.main:app --reload
