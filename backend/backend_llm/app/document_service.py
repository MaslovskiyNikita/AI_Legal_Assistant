import asyncio
from io import BytesIO
from typing import Dict, Any
from backend_llm.app.parser.parser import DocumentParser
from .diff_service import SmartDiffService
from .ai_service import AiRiskAnalyzer
from .models import FullDocumentAnalysis, ChangeType


class DocumentComparisonManager:
    @staticmethod
    async def compare_and_analyze(old_file_content: bytes, new_file_content: bytes) -> Dict[str, Any]:
        """
        Главная точка входа. Принимает байты, возвращает готовый словарь для API.
        """
        # 1. Парсинг
        old_blocks = await asyncio.to_thread(DocumentParser.parse, BytesIO(old_file_content))
        new_blocks = await asyncio.to_thread(DocumentParser.parse, BytesIO(new_file_content))

        # 2. Сравнение
        diff_blocks = await asyncio.to_thread(SmartDiffService.compare, old_blocks, new_blocks)

        # 3. Фильтрация значимых изменений
        meaningful_diffs = [b for b in diff_blocks if b.change_type != ChangeType.UNCHANGED]
 
        if not meaningful_diffs:
            analysis = FullDocumentAnalysis(
                overall_risk="GREEN",
                summary="Изменений не найдено или они незначительны",
                details=[]
            )
            return {
                "diff_blocks": [],
                "analysis": analysis.model_dump()
            }

        # 4. AI Анализ
        analysis = await AiRiskAnalyzer.analyze_changes(meaningful_diffs)

        # 5. МАППИНГ: Привязываем ответы AI обратно к блокам, чтобы они не были None
        for i, detail in enumerate(analysis.details):
            if i < len(meaningful_diffs):
                meaningful_diffs[i].risk = detail.risk.value
                meaningful_diffs[i].comment = detail.explanation
                meaningful_diffs[i].violated_law = detail.violated_law

        def prepare_response():
            return {
                "diff_blocks": [b.model_dump() for b in meaningful_diffs],
                "analysis": analysis.model_dump()
            }
        return await asyncio.to_thread(prepare_response)