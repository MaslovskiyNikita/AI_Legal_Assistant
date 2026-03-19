import re
import difflib
from typing import List, Set, Dict, Optional
from rapidfuzz import fuzz  # Уже есть в вашем pyproject.toml
from .models import DocumentBlock, BlockDiff, ChangeType


class SmartDiffService:
    @staticmethod
    def compare(old_blocks: List[DocumentBlock], new_blocks: List[DocumentBlock]) -> List[BlockDiff]:
        diffs: List[BlockDiff] = []

        # Множества для отслеживания использованных блоков
        matched_old_indices: Set[int] = set()
        matched_new_indices: Set[int] = set()

        # 1. Точное совпадение (Hash match) - Самый быстрый проход
        # Создаем мапу {hash: [indices]} для быстрой проверки
        old_hash_map: Dict[str, List[int]] = {}
        for i, b in enumerate(old_blocks):
            old_hash_map.setdefault(b.hash, []).append(i)

        for j, new_b in enumerate(new_blocks):
            if new_b.hash in old_hash_map:
                # Берем первый доступный индекс с таким же хешем
                for i in old_hash_map[new_b.hash]:
                    if i not in matched_old_indices:
                        diffs.append(BlockDiff(
                            change_type=ChangeType.UNCHANGED,
                            old_block=old_blocks[i],
                            new_block=new_b,
                            diff_html=new_b.text  # Для неизмененных просто текст
                        ))
                        matched_old_indices.add(i)
                        matched_new_indices.add(j)
                        break

        # 2. Совпадение по ID (например, "Статья 5")
        # Важно для юридических документов: если ID совпал, это тот же блок, даже если текст сильно изменен
        old_id_map: Dict[str, int] = {
            b.id: i for i, b in enumerate(old_blocks)
            if b.id and i not in matched_old_indices
        }

        for j, new_b in enumerate(new_blocks):
            if j in matched_new_indices or not new_b.id:
                continue

            if new_b.id in old_id_map:
                old_idx = old_id_map[new_b.id]
                old_b = old_blocks[old_idx]

                diffs.append(BlockDiff(
                    change_type=ChangeType.MODIFIED,
                    old_block=old_b,
                    new_block=new_b,
                    diff_html=DiffService.generate_inline_diff(old_b.text, new_b.text)
                ))
                matched_old_indices.add(old_idx)
                matched_new_indices.add(j)

        # 3. Нечеткое сравнение (Fuzzy match) для оставшихся
        # Используем rapidfuzz для скорости
        for j, new_b in enumerate(new_blocks):
            if j in matched_new_indices:
                continue

            best_ratio = 0.0
            best_old_idx = -1

            for i, old_b in enumerate(old_blocks):
                if i in matched_old_indices:
                    continue

                # rapidfuzz.fuzz.ratio работает быстрее difflib
                ratio = fuzz.ratio(old_b.text, new_b.text) / 100.0
                if ratio > best_ratio:
                    best_ratio = ratio
                    best_old_idx = i

            if best_ratio > 0.7:  # Снизили порог до 0.7 для лучшего захвата изменений
                old_b = old_blocks[best_old_idx]
                diffs.append(BlockDiff(
                    change_type=ChangeType.MODIFIED,
                    old_block=old_b,
                    new_block=new_b,
                    diff_html=DiffService.generate_inline_diff(old_b.text, new_b.text)
                ))
                matched_old_indices.add(best_old_idx)
                matched_new_indices.add(j)

        # 4. Сбор оставшихся (Добавленные)
        for j, new_b in enumerate(new_blocks):
            if j not in matched_new_indices:
                diffs.append(BlockDiff(
                    change_type=ChangeType.ADDED,
                    old_block=None,
                    new_block=new_b,
                    diff_html=f"<ins>{new_b.text}</ins>"
                ))

        # 5. Сбор оставшихся (Удаленные)
        for i, old_b in enumerate(old_blocks):
            if i not in matched_old_indices:
                diffs.append(BlockDiff(
                    change_type=ChangeType.DELETED,
                    old_block=old_b,
                    new_block=None,
                    diff_html=f"<del>{old_b.text}</del>"
                ))

        # Финальная сортировка:
        # Сначала по индексу в новом документе. Удаленные блоки ставим после их бывших соседей.
        def sort_key(d: BlockDiff):
            if d.new_block:
                return d.new_block.index
            if d.old_block:
                # Если блок удален, пытаемся приткнуть его "примерно" туда, где он был
                return d.old_block.index - 0.5
            return 0

        diffs.sort(key=sort_key)
        return diffs


class DiffService:
    @staticmethod
    def generate_inline_diff(old_text: str, new_text: str) -> str:
        if not old_text: return f"<ins>{new_text}</ins>"
        if not new_text: return f"<del>{old_text}</del>"

        # ДОБАВЛЕНО: Схлопываем все PDF-разрывы строк и множественные пробелы в один пробел.
        # Это спасет difflib от рассинхрона из-за невидимых артефактов PDF
        old_text = re.sub(r'\s+', ' ', old_text).strip()
        new_text = re.sub(r'\s+', ' ', new_text).strip()

        # Разбиваем на токены (слова, пробелы, знаки)
        tokenizer = re.compile(r'(\s+|[^\w\s]|\w+)', re.UNICODE)
        old_tokens = tokenizer.findall(old_text)
        new_tokens = tokenizer.findall(new_text)

        matcher = difflib.SequenceMatcher(None, old_tokens, new_tokens)

        result = []
        pending_del = []
        pending_ins = []

        def flush():
            if pending_del:
                result.append(f"<del>{''.join(pending_del)}</del>")
                pending_del.clear()
            if pending_ins:
                result.append(f"<ins>{''.join(pending_ins)}</ins>")
                pending_ins.clear()

        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == 'equal':
                content = "".join(old_tokens[i1:i2])

                # Делаем алгоритм чуть строже: считаем якорем кусок длиннее 15 символов
                is_anchor = len(content) > 15 or len(content.split()) >= 3

                if is_anchor:
                    flush()
                    result.append(content)
                else:
                    pending_del.append("".join(old_tokens[i1:i2]))
                    pending_ins.append("".join(new_tokens[j1:j2]))

            elif tag == 'delete':
                pending_del.append("".join(old_tokens[i1:i2]))
            elif tag == 'insert':
                pending_ins.append("".join(new_tokens[j1:j2]))
            elif tag == 'replace':
                pending_del.append("".join(old_tokens[i1:i2]))
                pending_ins.append("".join(new_tokens[j1:j2]))

        flush()
        return "".join(result)