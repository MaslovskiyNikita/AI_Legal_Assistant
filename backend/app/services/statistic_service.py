from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.statistycs import RiskStatisticResponse, ActivityStatisticResponse, LawStatisticResponse

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
            
    response = [
        RiskStatisticResponse(risk_type=risk, count=count)
        for risk, count in stats.items()
    ]
            
    return response


async def user_activity_on_seven_days(user_id: int, db: AsyncSession):
    query = text("""
        SELECT TO_CHAR(DATE(created_at), 'DD.MM') as date, COUNT(*) as message_count
        FROM chats
        WHERE user_id = :user_id 
          AND created_at >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) ASC;
    """)
    
    result = await db.execute(query, {"user_id": user_id})
    rows = result.fetchall()
    
    activity_stats = [
            ActivityStatisticResponse(date=row.date, message_count=row.message_count)
            for row in rows
        ]
    
    return activity_stats


async def top_laws(user_id: int, db: AsyncSession):
    query = text("""
        SELECT detail->>'violated_law' AS law, COUNT(*) as count
        FROM chats c
        JOIN messages m ON c.id = m.chat_id,
        jsonb_array_elements(m.ai_data->'analysis'->'details') AS detail
        WHERE c.user_id = :user_id 
          AND m.ai_data IS NOT NULL 
          AND detail->>'violated_law' IS NOT NULL 
          AND detail->>'violated_law' != 'null'
        GROUP BY detail->>'violated_law'
        ORDER BY count DESC
        LIMIT 3;
    """)
    
    result = await db.execute(query, {"user_id": user_id})
    rows = result.fetchall()
    
    top_laws = [
        LawStatisticResponse(law_name=row.law, count=row.count)
        for row in rows
    ]
    
    return top_laws


