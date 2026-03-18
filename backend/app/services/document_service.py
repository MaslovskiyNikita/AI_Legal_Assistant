    
from fastapi import HTTPException, UploadFile
from sqlalchemy import select, update
from app.models.document import Document
from app.models.chat import Message
from app.models.user import User
import os
import aiofiles
import uuid



UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def save_uploaded_documents(db, user_id: int, chat_id: int, old_file: UploadFile, new_file: UploadFile, text: str = ""):    
    
    # 👇 Используем текст от пользователя, если он есть
    msg_text = text if text.strip() else f"Прикреплены документы для сравнения:\n1. {old_file.filename}\n2. {new_file.filename}"
        
    new_msg = Message(
        chat_id=chat_id,
        role="user",
        text=msg_text
    )
    db.add(new_msg)
    await db.flush() 

    saved_docs = []
    # ... (цикл for file in [old_file, new_file]: остается без изменений) ...
    for file in [old_file, new_file]:
        unique_id = uuid.uuid4()
        safe_filename = f"{unique_id}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)
        
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
            
        new_doc = Document(
            user_id=user_id,
            message_id=new_msg.id, 
            filename=file.filename,
            file_path=file_path
        )
        db.add(new_doc)
        saved_docs.append(new_doc)

    await db.execute(update(User).where(User.id == user_id).values(documents_analyzed=User.documents_analyzed + 2))
    await db.commit()

    return {
        "status": "success",
        "message": "Файлы сохранены на сервере",
        "message_id": new_msg.id,  # <--- 👇 ВОЗВРАЩАЕМ ПРАВИЛЬНЫЙ ID ФРОНТЕНДУ!
        "old_document_id": saved_docs[0].id,
        "new_document_id": saved_docs[1].id
    }

async def get_document_by_id(db, document_id: int) -> Document | None:
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Документ не найден в базе")

    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Файл потерян на сервере")
    
    return doc