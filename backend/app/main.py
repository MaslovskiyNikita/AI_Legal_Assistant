import logging
import sys
from app.utils.logging import InterceptHandler
from loguru import logger

SILENT_LOGGERS = [
    "uvicorn.access",
    "uvicorn.error",
    "sqlalchemy.engine",
    "httpcore",
    "httpx",
    "anyio",
]

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import app.models.user 
import app.models.chat
from app.api.v1 import auth, chats, documents, export

logging.getLogger("uvicorn.access").handlers = []
logging.getLogger("uvicorn.error").handlers = []
logging.getLogger("sqlalchemy.engine").handlers = []

logging.basicConfig(handlers=[InterceptHandler()], level=logging.INFO, force=True)

logger.configure(handlers=[{
    "sink": sys.stdout, 
    "format": "<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{message}</cyan>",
    "colorize": True 
}])

logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

app = FastAPI(title="LegalAI Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chats.router)
app.include_router(documents.router)
app.include_router(export.router)

@app.get("/api/v1/ping")
async def ping():
    return {"status": "ok", "message": "Бэкенд работает, Uvicorn запустился!"}