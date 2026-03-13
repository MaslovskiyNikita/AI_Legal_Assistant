from fastapi import APIRouter, UploadFile, File

router = APIRouter(prefix="/api/v1/documents", tags=["Documents"])

@router.post("/compare")
async def upload_documents_for_comparison(
    old_file: UploadFile = File(...), 
    new_file: UploadFile = File(...)
):

    # В будущем здесь будет сохранение файлов на диск/S3 и парсинг текста
    print(f"Получены файлы: {old_file.filename} и {new_file.filename}")
    
    return {
        "comparison_id": 99,
        "message": "Файлы успешно загружены и готовы к сравнению"
    }