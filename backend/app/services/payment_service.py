import os
from fastapi import HTTPException
import httpx
from sqlalchemy import update
from app.core.prices import PackagePrices
from app.models.user import User
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.user import InvoiceRequest
from loguru import logger

BOT_TOKEN = os.getenv("BOT_TOKEN", "")

async def purchase_package(db: AsyncSession, request: InvoiceRequest) -> bool:
    if request.package_id not in PackagePrices.__dict__:
        raise HTTPException(status_code=400, detail="Invalid package")
    
    pack = PackagePrices.__dict__[request.package_id]
    
    payload = f"user_{request.telegram_id}_{request.package_id}"
    
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/createInvoiceLink"
    data = {
        "title": f"Пополнение {pack['tokens']} токенов",
        "description": "Токены для AI Legal Expert. Используются для анализа документов.",
        "payload": payload,
        "provider_token": "",
        "currency": "XTR",
        "prices": [{"label": f"{pack['tokens']} токенов", "amount": pack['stars']}]
    }
    
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=data)
        result = response.json()
        
        if not result.get("ok"):
            logger.error(f"Ошибка создания инвойса: {result}")
            raise HTTPException(status_code=500, detail="Failed to create invoice")
            
        return {"invoice_link": result["result"]}
    
    
async def confirm_payment(db: AsyncSession, data: dict) -> bool:
    
    if "pre_checkout_query" in data:
        query_id = data["pre_checkout_query"]["id"]
        logger.info(f"⏳ Получен pre_checkout_query ID: {query_id}")
        
        url = f"https://api.telegram.org/bot{BOT_TOKEN}/answerPreCheckoutQuery"
        payload = {
            "pre_checkout_query_id": query_id,
            "ok": True 
        }
        
        async with httpx.AsyncClient() as client:
            await client.post(url, json=payload)
            
        logger.info("✅ Отправлен ответ answerPreCheckoutQuery")
        return True

    if "message" in data and "successful_payment" in data["message"]:
        payment = data["message"]["successful_payment"]
        payload = payment.get("invoice_payload", "")
        
        logger.info(f"💰 Успешная оплата! Payload: {payload}")

        try:
            _, tg_id_str, package_id = payload.split("_", 2)
            telegram_id = int(tg_id_str)
            tokens_to_add = PackagePrices.__dict__[package_id]["tokens"]
            
            await db.execute(
                update(User)
                .where(User.telegram_id == telegram_id)
                .values(token_balance=User.token_balance + tokens_to_add)
            )
            await db.commit()
            logger.success(f"✅ Начислено {tokens_to_add} токенов пользователю {telegram_id}")
            
        except Exception as e:
            logger.error(f"❌ Ошибка при начислении токенов: {e}")
            
    return True
    