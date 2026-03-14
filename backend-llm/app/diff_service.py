import difflib
from .models import DocumentBlock, BlockDiff, ChangeType

class DiffService:
    @staticmethod
    def generate_inline_diff(old_text: str, new_text: str) -> str:
        if not old_text: return f"<ins>{new_text}</ins>"
        if not new_text: return f"<del>{old_text}</del>"
        
        # Простое сравнение на уровне символов/слов для HTML
        result = ""
        s = difflib.SequenceMatcher(None, old_text, new_text)
        for tag, i1, i2, j1, j2 in s.get_opcodes():
            if tag == 'equal':
                result += old_text[i1:i2]
            elif tag == 'delete':
                result += f"<del>{old_text[i1:i2]}</del>"
            elif tag == 'insert':
                result += f"<ins>{new_text[j1:j2]}</ins>"
            elif tag == 'replace':
                result += f"<del>{old_text[i1:i2]}</del><ins>{new_text[j1:j2]}</ins>"
        return result

    @staticmethod
    def compare(old_blocks: list[DocumentBlock], new_blocks: list[DocumentBlock]) -> list[BlockDiff]:
        old_texts = [b.text for b in old_blocks]
        new_texts = [b.text for b in new_blocks]
        
        matcher = difflib.SequenceMatcher(None, old_texts, new_texts)
        diffs = []

        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == 'equal':
                for k in range(i2 - i1):
                    diffs.append(BlockDiff(
                        change_type=ChangeType.UNCHANGED,
                        old_block=old_blocks[i1 + k],
                        new_block=new_blocks[j1 + k]
                    ))
            elif tag == 'insert':
                for k in range(j2 - j1):
                    diffs.append(BlockDiff(change_type=ChangeType.ADDED, new_block=new_blocks[j1 + k]))
            elif tag == 'delete':
                for k in range(i2 - i1):
                    diffs.append(BlockDiff(change_type=ChangeType.DELETED, old_block=old_blocks[i1 + k]))
            elif tag == 'replace':
                # Пытаемся сопоставить блоки внутри замены
                max_len = max(i2 - i1, j2 - j1)
                for k in range(max_len):
                    old = old_blocks[i1 + k] if (i1 + k) < i2 else None
                    new = new_blocks[j1 + k] if (j1 + k) < j2 else None
                    
                    ctype = ChangeType.MODIFIED
                    if not old: ctype = ChangeType.ADDED
                    if not new: ctype = ChangeType.DELETED
                    
                    diffs.append(BlockDiff(
                        change_type=ctype,
                        old_block=old,
                        new_block=new,
                        diff_html=DiffService.generate_inline_diff(old.text, new.text) if old and new else None
                    ))
        return diffs