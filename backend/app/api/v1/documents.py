import os
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.api.dependencies import get_db
from app.services.document_service import get_document_by_id, save_uploaded_documents

router = APIRouter(prefix="/api/v1/documents", tags=["Documents"])

@router.post("/compare")
async def upload_documents_for_comparison(
    chat_id: int = Form(...),
    user_id: int = Form(...),
    text: str = Form(""),
    old_file: UploadFile = File(...), 
    new_file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    logger.info(f"📤 Загрузка файлов для сравнения (Chat ID: {chat_id}, User ID: {user_id})")

    try:
        response = await save_uploaded_documents(db, user_id, chat_id, old_file, new_file, text)
        return response
    except Exception as e:
        logger.error(f"❌ Ошибка при сохранении документов: {str(e)}")
        raise HTTPException(status_code=500, detail="Ошибка при обработке файлов")
    
    
@router.get("/{document_id}/download")
async def download_document(
    document_id: int, 
    db: AsyncSession = Depends(get_db)
):
    logger.info(f"📥 Запрос на скачивание документа ID: {document_id}")

    doc = await get_document_by_id(db, document_id)
    
    if not doc:
        logger.warning(f"⚠️ Документ ID {document_id} не найден в базе данных")
        raise HTTPException(status_code=404, detail="Документ не найден")

    if not os.path.exists(doc.file_path):
        logger.error(f"🚨 Файл найден в БД, но отсутствует на диске: {doc.file_path}")
        raise HTTPException(status_code=404, detail="Файл отсутствует на сервере")

    logger.success(f"💾 Файл {doc.filename} готов к отправке (путь: {doc.file_path})")
    
    return FileResponse(
        path=doc.file_path, 
        filename=doc.filename,
        media_type="application/octet-stream" 
    )