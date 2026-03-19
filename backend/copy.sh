#!/bin/bash

# Файл для временного хранения текста
TEMP_FILE="all_python_code.tmp"
echo "" > "$TEMP_FILE"

# Список папок и паттернов, которые нужно игнорировать
# (добавлены типичные для Python: __pycache__, venv, .pytest_cache и т.д.)
IGNORE_DIRS="-not -path '*/.*' -not -path '*/__pycache__/*' -not -path '*/venv/*' -not -path '*/env/*' -not -path '*/.pytest_cache/*' -not -path '*/build/*' -not -path '*/dist/*'"

echo "🔍 Поиск Python файлов..."

# Ищем файлы .py
files=$(eval "find . -type f -name '*.py' $IGNORE_DIRS")

# Также можно добавить pyproject.toml, чтобы AI видел зависимости
if [ -f "pyproject.toml" ]; then
    files="pyproject.toml $files"
fi

if [ -z "$files" ]; then
    echo "❌ Файлы .py не найдены."
    exit 1
fi

for file in $files; do
    echo "📄 Читаю: $file"
    echo -e "\n============================================================" >> "$TEMP_FILE"
    echo "FILE: $file" >> "$TEMP_FILE"
    echo -e "============================================================\n" >> "$TEMP_FILE"
    cat "$file" >> "$TEMP_FILE"
    echo -e "\n" >> "$TEMP_FILE"
done

# Определяем утилиту для копирования в зависимости от ОС
if command -v pbcopy > /dev/null; then
    cat "$TEMP_FILE" | pbcopy
    echo "✅ Скопировано в буфер обмена (macOS)."
elif command -v clip.exe > /dev/null; then
    cat "$TEMP_FILE" | clip.exe
    echo "✅ Скопировано в буфер обмена (Windows/WSL)."
elif command -v xclip > /dev/null; then
    cat "$TEMP_FILE" | xclip -selection clipboard
    echo "✅ Скопировано в буфер обмена (Linux/xclip)."
elif command -v wl-copy > /dev/null; then
    cat "$TEMP_FILE" | wl-copy
    echo "✅ Скопировано в буфер обмена (Linux/Wayland)."
else
    echo "❌ Ошибка: Не найдена утилита для копирования."
    echo "Весь текст собран в файле: $TEMP_FILE"
    exit 1
fi

# Удаляем временный файл
rm "$TEMP_FILE"
