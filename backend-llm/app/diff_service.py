import difflib

class DiffService:
    @staticmethod
    def get_unified_diff(old_text: str, new_text: str) -> str:
        old_lines = old_text.splitlines()
        new_lines = new_text.splitlines()
        
        diff = difflib.unified_diff(
            old_lines, 
            new_lines, 
            fromfile='Старая версия', 
            tofile='Новая версия', 
            lineterm=''
        )
        return "\n".join(list(diff))

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