#!/bin/bash
echo "Запуск миграций базы данных (Alembic)..."
poetry run alembic revision --autogenerate -m "Initial migration: create users table"
poetry run alembic upgrade head

echo "Запуск сидера (заполнение тестовыми данными)..."
poetry run python -c "
import asyncio
from app.core.database import AsyncSessionLocal
from app.seed import seed_db

async def run_seed():
    async with AsyncSessionLocal() as session:
        await seed_db(session)

asyncio.run(run_seed())
"
echo "База данных успешно обновлена и заполнена!"

exec "$@"