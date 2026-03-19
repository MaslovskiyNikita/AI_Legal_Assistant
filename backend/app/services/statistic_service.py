from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

async def get_risk_statistic(user_id: int, db: AsyncSession):
    query = text("""
        SELECT 
            elem->>'risk' AS risk_level, 
            COUNT(*) AS count
        FROM 
            chats c
        JOIN 
            messages m ON c.id = m.chat_id,
            jsonb_array_elements(m.ai_data->'diff_blocks') AS elem
        WHERE 
            c.user_id = :user_id
            AND m.ai_data IS NOT NULL 
            AND m.ai_data->'diff_blocks' IS NOT NULL
        GROUP BY 
            elem->>'risk';
    """)
    
    result = await db.execute(query, {"user_id": user_id})
    rows = result.fetchall()
    
    stats = {
        "RED": 0,
        "YELLOW": 0,
        "GREEN": 0
    }
    
    for row in rows:
        risk_level = row.risk_level
        if risk_level in stats:
            stats[risk_level] = row.count
            
    return stats