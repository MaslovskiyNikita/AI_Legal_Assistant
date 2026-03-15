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
from .diff_service import DiffService, SmartDiffService
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
    # 1. Получаем бинарные данные
    old_content = await oldFile.read()
    new_content = await newFile.read()
    
    # 2. Парсим на блоки (Smart Alignment)
    old_blocks = DocxParser.parse(BytesIO(old_content))
    new_blocks = DocxParser.parse(BytesIO(new_content))
    
    # 3. Сравниваем блоки и получаем структурированный diff
    diff_blocks = SmartDiffService.compare(old_blocks, new_blocks)
    
    # 4. Выделяем только значимые изменения для AI-анализа
    meaningful_diffs = [b for b in diff_blocks if b.change_type != ChangeType.UNCHANGED]
    
    if not meaningful_diffs:
        analysis = FullDocumentAnalysis(overall_risk="GREEN", summary="Изменений не найдено или они незначительны", details=[])
        return {
            "diff_blocks": [],
            "analysis": analysis.model_dump()
        }

    # 5. Анализируем изменения батчами с RAG
    # передаем только meaningful_diffs
    analysis = await AiRiskAnalyzer.analyze_changes(meaningful_diffs)
    
    return {
        "diff_blocks": [b.model_dump() for b in meaningful_diffs],
        "analysis": analysis.model_dump()
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
async def export_report(diff_blocks: str = Form(...), analysis: str = Form(...)):
    try:
        import json
        analysis_dict = json.loads(analysis)
        analysis_obj = FullDocumentAnalysis(**analysis_dict)
        
        docx_buf = ExportService.generate_docx_report(diff_blocks, analysis_obj)
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