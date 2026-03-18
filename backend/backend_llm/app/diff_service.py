from typing import List, Dict
from rapidfuzz import fuzz, process
import difflib

from .models import DocumentBlock, BlockDiff, ChangeType


class SmartDiffService:
    @staticmethod
    def compare(old_blocks: List[DocumentBlock], new_blocks: List[DocumentBlock]) -> List[BlockDiff]:
        diffs: List[BlockDiff] = []

        # --- Копии списков ---
        old_unmatched = list(old_blocks)
        new_unmatched = list(new_blocks)

        # --- Индексы для O(1) доступа ---
        new_by_hash: Dict[str, DocumentBlock] = {b.hash: b for b in new_unmatched}
        new_by_id: Dict[str, DocumentBlock] = {b.id: b for b in new_unmatched if b.id}

        # =========================
        # Step 1: Exact match (hash)
        # =========================
        new_unmatched_set = set(new_unmatched)

        remaining_old = []
        for old_b in old_unmatched:
            new_b = new_by_hash.get(old_b.hash)
            if new_b and new_b in new_unmatched_set:
                diffs.append(BlockDiff(
                    change_type=ChangeType.UNCHANGED,
                    old_block=old_b,
                    new_block=new_b
                ))
                new_unmatched_set.remove(new_b)
            else:
                remaining_old.append(old_b)

        old_unmatched = remaining_old
        new_unmatched = list(new_unmatched_set)

        # =========================
        # Step 2: Match by ID
        # =========================
        new_by_id = {b.id: b for b in new_unmatched if b.id}

        remaining_old = []
        for old_b in old_unmatched:
            if old_b.id and old_b.id in new_by_id:
                new_b = new_by_id[old_b.id]

                diff_html = DiffService.generate_inline_diff(old_b.text, new_b.text)

                diffs.append(BlockDiff(
                    change_type=ChangeType.MODIFIED,
                    old_block=old_b,
                    new_block=new_b,
                    diff_html=diff_html
                ))

                new_unmatched.remove(new_b)
            else:
                remaining_old.append(old_b)

        old_unmatched = remaining_old

        # =========================
        # Step 3: Fuzzy match (rapidfuzz)
        # =========================
        remaining_old = []

        # Подготовка текста для rapidfuzz
        choices = {i: b.text for i, b in enumerate(new_unmatched)}

        for old_b in old_unmatched:
            if not choices:
                remaining_old.append(old_b)
                continue

            match = process.extractOne(
                old_b.text,
                choices,
                scorer=fuzz.ratio
            )

            if match:
                best_idx, score, _ = match
                similarity = score / 100

                if similarity > 0.8:
                    new_b = new_unmatched[best_idx]

                    diff_html = DiffService.generate_inline_diff(old_b.text, new_b.text)

                    diffs.append(BlockDiff(
                        change_type=ChangeType.MODIFIED,
                        old_block=old_b,
                        new_block=new_b,
                        diff_html=diff_html
                    ))

                    # Удаляем из доступных
                    del choices[best_idx]
                    new_unmatched[best_idx] = None  # помечаем
                    continue

            remaining_old.append(old_b)

        old_unmatched = remaining_old
        new_unmatched = [b for b in new_unmatched if b is not None]

        # =========================
        # Step 4: Remaining
        # =========================
        for old_b in old_unmatched:
            diffs.append(BlockDiff(
                change_type=ChangeType.DELETED,
                old_block=old_b,
                new_block=None,
                diff_html=f"<del>{old_b.text}</del>"
            ))

        for new_b in new_unmatched:
            diffs.append(BlockDiff(
                change_type=ChangeType.ADDED,
                old_block=None,
                new_block=new_b,
                diff_html=f"<ins>{new_b.text}</ins>"
            ))

        # =========================
        # Sort (оставляем как у тебя)
        # =========================
        diffs.sort(
            key=lambda x: (
                x.new_block.index if x.new_block else x.old_block.index,
                x.change_type.value
            )
        )

        return diffs


class DiffService:
    @staticmethod
    def generate_inline_diff(old_text: str, new_text: str) -> str:
        if not old_text:
            return f"<ins>{new_text}</ins>"
        if not new_text:
            return f"<del>{old_text}</del>"

        # 🔥 Быстрый early exit
        if old_text == new_text:
            return old_text

        # 🔥 если почти одинаковые — не тратим время на diff
        if fuzz.ratio(old_text, new_text) > 95:
            return new_text

        result = []
        s = difflib.SequenceMatcher(None, old_text, new_text)

        for tag, i1, i2, j1, j2 in s.get_opcodes():
            if tag == 'equal':
                result.append(old_text[i1:i2])
            elif tag == 'delete':
                result.append(f"<del>{old_text[i1:i2]}</del>")
            elif tag == 'insert':
                result.append(f"<ins>{new_text[j1:j2]}</ins>")
            elif tag == 'replace':
                result.append(f"<del>{old_text[i1:i2]}</del>")
                result.append(f"<ins>{new_text[j1:j2]}</ins>")

        return "".join(result)