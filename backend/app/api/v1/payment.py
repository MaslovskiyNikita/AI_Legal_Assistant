from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger
from app.services.payment_service import purchase_package, confirm_payment
from app.api.dependencies import get_db
from app.schemas.user import InvoiceRequest

router = APIRouter(prefix="/api/v1/payments", tags=["Payments"])

@router.post("/invoice")
async def create_invoice(request: InvoiceRequest, db: AsyncSession = Depends(get_db)):
    logger.info(f"💰 Запрос на создание счета для Telegram ID={request.telegram_id} и Package ID={request.package_id}")
    
    response = await purchase_package(db, request)
    invoice_url = response.get("invoice_link", "")
    
    logger.success(f"✅ Счет создан успешно. URL: {invoice_url}")
    
    return {"invoice_url": invoice_url}


@router.post("/confirm")
async def confirm_payment_endpoint(request: str, db: AsyncSession = Depends(get_db)):
    logger.info("🔔 Получен запрос на подтверждение оплаты")
    data = await request.json()
    success = await confirm_payment(db, request)
    
    if success:
        logger.success("✅ Оплата подтверждена и баланс обновлен")
        return {"status": "success", "message": "Оплата подтверждена"}
    else:
        logger.error("❌ Не удалось подтвердить оплату")
        return {"status": "error", "message": "Не удалось подтвердить оплату"}
