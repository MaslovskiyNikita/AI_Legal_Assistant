import difflib
from typing import List
from .models import DocumentBlock, BlockDiff, ChangeType

class SmartDiffService:
    @staticmethod
    def compare(old_blocks: List[DocumentBlock], new_blocks: List[DocumentBlock]) -> List[BlockDiff]:
        diffs = []
        old_unmatched = old_blocks[:]
        new_unmatched = new_blocks[:]

        # Step 1: Exact match (by hash)
        old_idx = 0
        while old_idx < len(old_unmatched):
            old_b = old_unmatched[old_idx]
            match_found = False
            for new_idx, new_b in enumerate(new_unmatched):
                if old_b.hash == new_b.hash:
                    diffs.append(BlockDiff(
                        change_type=ChangeType.UNCHANGED,
                        old_block=old_b,
                        new_block=new_b
                    ))
                    old_unmatched.pop(old_idx)
                    new_unmatched.pop(new_idx)
                    match_found = True
                    break
            if not match_found:
                old_idx += 1

        # Step 2: ID match
        old_idx = 0
        while old_idx < len(old_unmatched):
            old_b = old_unmatched[old_idx]
            match_found = False
            if old_b.id:
                for new_idx, new_b in enumerate(new_unmatched):
                    if new_b.id == old_b.id:
                        # Same ID but different text
                        diff_html = DiffService.generate_inline_diff(old_b.text, new_b.text)
                        diffs.append(BlockDiff(
                            change_type=ChangeType.MODIFIED,
                            old_block=old_b,
                            new_block=new_b,
                            diff_html=diff_html
                        ))
                        old_unmatched.pop(old_idx)
                        new_unmatched.pop(new_idx)
                        match_found = True
                        break
            if not match_found:
                old_idx += 1

        # Step 3: Fuzzy match
        old_idx = 0
        while old_idx < len(old_unmatched):
            old_b = old_unmatched[old_idx]
            best_match_idx = -1
            best_ratio = 0.0
            
            for new_idx, new_b in enumerate(new_unmatched):
                ratio = difflib.SequenceMatcher(None, old_b.text, new_b.text).ratio()
                if ratio > best_ratio:
                    best_ratio = ratio
                    best_match_idx = new_idx
            
            if best_ratio > 0.8:
                new_b = new_unmatched[best_match_idx]
                diff_html = DiffService.generate_inline_diff(old_b.text, new_b.text)
                diffs.append(BlockDiff(
                    change_type=ChangeType.MODIFIED,
                    old_block=old_b,
                    new_block=new_b,
                    diff_html=diff_html
                ))
                old_unmatched.pop(old_idx)
                new_unmatched.pop(best_match_idx)
            else:
                old_idx += 1

        # Step 4: Remaining blocks
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

        # Sort the diffs to maintain a sensible order
        # We can sort by the new block's index if it exists, otherwise by old block's index
        diffs.sort(key=lambda x: (x.new_block.index if x.new_block else x.old_block.index, x.change_type.value))
        
        return diffs

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