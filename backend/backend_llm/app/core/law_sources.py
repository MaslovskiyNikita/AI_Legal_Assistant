# Единый реестр всех юридических документов
LAW_SOURCES_REGISTRY = [
    {
        "name": "Конституция Республики Беларусь",
        "url": "https://pravo.by/pravovaya-informatsiya/normativnye-dokumenty/konstitutsiya-respubliki-belarus/",
        "aliases": ["конституци", "конституция рб"]
    },
    {
        "name": "Уголовный кодекс Республики Беларусь",
        "url": "https://pravo.by/document/?guid=3871&p0=Hk9900275",
        "aliases": ["уголовный кодекс", "ук рб"]
    },
    {
        "name": "Гражданский кодекс Республики Беларусь",
        "url": "https://pravo.by/document/?guid=3871&p0=Hk9800218",
        "aliases": ["гражданский кодекс", "гк рб"]
    },
    {
        "name": "Трудовой кодекс Республики Беларусь",
        "url": "https://pravo.by/document/?guid=3871&p0=HK9900296",
        "aliases": ["трудовой кодекс", "тк рб"]
    }
]

# Функция для быстрого получения URL по точному названию источника (для AI)
def get_url_by_source_name(source_name: str) -> str:
    for src in LAW_SOURCES_REGISTRY:
        if src["name"] == source_name:
            return src["url"]
    return ""

# Оставляем старый словарь LAW_SOURCES для обратной совместимости 
# (он используется в export_service.py для регулярных выражений)
LAW_SOURCES = {}
for src in LAW_SOURCES_REGISTRY:
    for alias in src["aliases"]:
        LAW_SOURCES[alias] = src["url"]
    # Добавляем полное имя в нижнем регистре для точного поиска
    LAW_SOURCES[src["name"].lower()] = src["url"]