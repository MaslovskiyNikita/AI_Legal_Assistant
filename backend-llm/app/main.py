import asyncio
import json
from io import BytesIO
from typing import List, Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response
from fastapi.encoders import jsonable_encoder
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv

from .models import DocumentBlock, BlockDiff, ChangeType, Chat, Message, FullDocumentAnalysis
from .parser import DocxParser
from .diff_service import DiffService
from .ai_service import AiRiskAnalyzer, RiskAnalysis
from .export_service import ExportService
from .chat_service import ChatService

load_dotenv()

app = FastAPI()

@app.get("/ping")
async def ping():
    return "Pong! FastAPI is working."

@app.post("/api/v1/documents/parse")
async def parse_document(file: UploadFile = File(...)):
    content = await file.read()
    blocks = DocxParser.parse(BytesIO(content))
    return blocks

@app.post("/api/v1/documents/compare")
async def compare_documents(oldFile: UploadFile = File(...), newFile: UploadFile = File(...)):
    # 1. Получаем чистый текст
    old_content = await oldFile.read()
    new_content = await newFile.read()
    
    old_text = DocxParser.parse_to_text(BytesIO(old_content))
    new_text = DocxParser.parse_to_text(BytesIO(new_content))
    
    # 2. Генерируем "Гит-подобный" Дифф
    diff_output = DiffService.get_unified_diff(old_text, new_text)
    
    if not diff_output:
        return {"message": "Изменений не найдено", "overall_risk": "GREEN"}

    # 3. Скармливаем всё нейронке целиком
    analysis = await AiRiskAnalyzer.analyze_diff(diff_output)
    
    return {
        "diff": diff_output, # Возвращаем сам текст с +++ --- для фронта
        "analysis": analysis # Структурированный JSON с рисками
    }

@app.post("/api/v1/chat/create")
async def create_chat(
    file: UploadFile = File(...), 
    analysis_data: Optional[str] = Form(None)  # Сюда фронтенд кинет JSON анализа
):
    content = await file.read()
    text = DocxParser.parse_to_text(BytesIO(content))
    
    # Создаем чат и сохраняем в него текст анализа
    chat = ChatService.create_chat(text, analysis_data)
    return {"chat_id": chat.id}

@app.post("/api/v1/chat/{chat_id}/message")
async def ask_chat(chat_id: int, text: str = Form(...)):
    chat = ChatService.get_chat(chat_id)
    if not chat: raise HTTPException(404)
    
    # Добавляем вопрос в историю
    ChatService.add_message(chat_id, "user", text)
    
    # Собираем историю для LLM
    history = [{"role": m.role, "content": m.text} for m in chat.messages]
    
    # Генерируем ответ (передаем и текст дока, и историю, и анализ)
    answer = await AiRiskAnalyzer.answer_question(
        chat.document_text, 
        text, 
        history, 
        chat.analysis_results
    )
    
    # Сохраняем ответ ассистента
    ChatService.add_message(chat_id, "assistant", answer)
    
    return {"answer": answer}

@app.get("/api/v1/chat/{chat_id}")
async def get_chat(chat_id: int):
    chat = ChatService.get_chat(chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat.model_dump()

@app.post("/api/v1/documents/export")
async def export_report(diff_text: str = Form(...), analysis: str = Form(...)):
    try:
        # Парсим analysis из JSON строки
        import json
        analysis_dict = json.loads(analysis)
        analysis_obj = FullDocumentAnalysis(**analysis_dict)
        
        docx_buf = ExportService.generate_docx_report(diff_text, analysis_obj)
        return StreamingResponse(
            docx_buf,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": "attachment; filename=Legal_Report.docx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating report: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)