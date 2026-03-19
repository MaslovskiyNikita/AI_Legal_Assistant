import aiofiles
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from loguru import logger

from app.models.chat import Message
from app.models.document import Document
from app.schemas.chat import ChatDetailResponse

from app.models.user import User
from backend_llm.app.ai_service import AiRiskAnalyzer
from backend_llm.app.document_service import DocumentComparisonManager
from app.services.chat_service import get_chat_with_messages

async def generate_ai_response(
    db: AsyncSession, 
    chat_id: int, 
    user_text: str = "", 
    comparison_message_id: int = None,
) -> dict:
    logger.info(f"🧠 Начинаю генерацию AI ответа для Chat ID={chat_id}")
    
    full_ai_response = ""
    diff_blocks_out = []

    if comparison_message_id:
        logger.info(f"📂 Запрос на сравнение документов для сообщения ID={comparison_message_id}")
        
        result = await db.execute(select(Document).where(Document.message_id == comparison_message_id))
        docs = result.scalars().all()
        
        if len(docs) == 2:
            logger.info(f"📄 Найдено 2 документа: '{docs[0].filename}' и '{docs[1].filename}'")
            
            async with aiofiles.open(docs[0].file_path, 'rb') as f1:
                old_bytes = await f1.read()
            async with aiofiles.open(docs[1].file_path, 'rb') as f2:
                new_bytes = await f2.read()

            try:
                logger.info("🛠️ Запуск нейросетевого анализатора (DocumentComparisonManager)...")
                analysis_data = await DocumentComparisonManager.compare_and_analyze(
                    old_file_content=old_bytes,
                    new_file_content=new_bytes
                )

                diff_blocks_out = analysis_data.get("diff_blocks", [])
                ai_analysis = analysis_data.get("analysis", {})
                risk = ai_analysis.get("overall_risk", "UNKNOWN")
                summary = ai_analysis.get("summary", "Анализ завершен.")
                
                
                
                await db.execute(update(User).where(User.id == docs[0].user_id).values(token_balance=User.token_balance - 10))
                await db.commit()
                
                logger.success(f"📊 Анализ выполнен. Уровень риска: {risk}, Найдено блоков изменений: {len(diff_blocks_out)}")
                full_ai_response = f"**Уровень риска: {risk}**\n\n{summary}"
                
            except Exception as e:
                logger.error(f"❌ Критическая ошибка при анализе документов: {str(e)}")
                full_ai_response = f"Произошла ошибка при анализе документов: {str(e)}"
        else:
            logger.warning(f"⚠️ Ожидалось 2 документа для сравнения, но найдено {len(docs)}. Перехожу в режим чата.")
            comparison_message_id = None 

    if not comparison_message_id:
        logger.info(f"💬 Режим обычного диалога. Загрузка истории чата ID={chat_id}")
        chat_history_orm = await get_chat_with_messages(db, chat_id)
    
        if chat_history_orm:
            chat_dict = ChatDetailResponse.model_validate(chat_history_orm).model_dump()
            
            logger.info(f"🤖 Отправка запроса в LLM (длина истории: {len(chat_dict)} сообщений)")
            full_ai_response = await AiRiskAnalyzer.answer_question(
                question=user_text,
                chat_history=chat_dict  
            )
            logger.success("🤖 Ответ от LLM успешно получен")
            logger.success(f"✨ Ответ AI: {full_ai_response[:200]}...")
            await db.execute(update(User).where(User.id == chat_history_orm.user_id).values(token_balance=User.token_balance - 5))
            await db.commit()
        else:
            logger.error(f"❌ Не удалось загрузить историю для чата ID={chat_id}")
            full_ai_response = "Ошибка: не удалось загрузить историю диалога."\
                
    ai_data_to_save = {
                        "diff_blocks": diff_blocks_out,
                        "analysis": ai_analysis
                    } if diff_blocks_out else None

    logger.info(f"💾 Сохранение ответа AI в базу данных...")
    ai_message = Message(chat_id=chat_id, role="ai", text=full_ai_response.strip(), ai_data=ai_data_to_save)
    db.add(ai_message)
    
    try:
        await db.commit()
        logger.success(f"🏁 Генерация завершена. Сообщение сохранено для чата ID={chat_id}")
    except Exception as e:
        logger.error(f"❌ Ошибка при коммите сообщения: {str(e)}")
        await db.rollback()

    return {
        "text": full_ai_response.strip(),
        "diff_blocks": diff_blocks_out
    }