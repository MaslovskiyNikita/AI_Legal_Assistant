from fastapi import FastAPI
import app.models.user 
import app.models.chat
from app.api.v1 import auth

app = FastAPI(title="LegalAI Assistant API")

app.include_router(auth.router)

@app.get("/api/v1/ping")
async def ping():
    return {"status": "ok", "message": "Бэкенд работает, Uvicorn запустился!"}