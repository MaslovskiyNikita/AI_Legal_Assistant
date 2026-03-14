import os
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_db
from app.services.document_service import get_document_by_id, save_uploaded_documents

router = APIRouter(prefix="/api/v1/documents", tags=["Documents"])

@router.post("/compare")
async def upload_documents_for_comparison(
    chat_id: int = Form(...),
    user_id: int = Form(...),
    old_file: UploadFile = File(...), 
    new_file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    response = await save_uploaded_documents(db, user_id, chat_id, old_file, new_file)
    return response

@router.get("/{document_id}/download")
async def download_document(
    document_id: int, 
    db: AsyncSession = Depends(get_db)
):

    doc = await get_document_by_id(db, document_id)

    return FileResponse(
        path=doc.file_path, 
        filename=doc.filename,
        media_type="application/octet-stream" 
    )