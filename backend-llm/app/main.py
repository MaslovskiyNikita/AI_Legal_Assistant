import asyncio
import json
from io import BytesIO
from typing import List

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response
from fastapi.encoders import jsonable_encoder
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv

from .models import DocumentBlock, BlockDiff, ChangeType
from .parser import DocxParser
from .diff_service import DiffService
from .ai_service import AiRiskAnalyzer
from .export_service import ExportService

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
    # Читаем файлы
    old_content = await oldFile.read()
    new_content = await newFile.read()
    
    old_blocks = DocxParser.parse(BytesIO(old_content))
    new_blocks = DocxParser.parse(BytesIO(new_content))
    
    # Сравниваем
    all_diffs = DiffService.compare(old_blocks, new_blocks)
    actual_changes = [d for d in all_diffs if d.change_type != ChangeType.UNCHANGED]
    
    # AI Анализ с ограничением параллельности (аналог Semaphore)
    semaphore = asyncio.Semaphore(5)
    
    async def enriched_analyze(diff: BlockDiff):
        async with semaphore:
            analysis = await AiRiskAnalyzer.analyze(
                old_text=diff.old_block.text if diff.old_block else None,
                new_text=diff.new_block.text if diff.new_block else None
            )
            diff.risk = analysis.get("risk")
            diff.comment = analysis.get("explanation")
            diff.violated_law = analysis.get("violated_law")
            diff.analysis_source = analysis.get("source")
            return diff

    tasks = [enriched_analyze(d) for d in actual_changes]
    results = await asyncio.gather(*tasks)

    # Красиво форматируем JSON (многострочный, с отступами, без экранирования кириллицы)
    encoded = jsonable_encoder(results)
    pretty = json.dumps(encoded, ensure_ascii=False, indent=2)
    return Response(content=pretty, media_type="application/json")

@app.post("/api/v1/documents/export")
async def export_report(diffs: List[BlockDiff]):
    try:
        docx_buf = ExportService.generate_docx_report(diffs)
        return StreamingResponse(
            docx_buf,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": "attachment; filename=Legal_Report.docx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)