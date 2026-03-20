import { Scale, Briefcase, FileSearch } from "lucide-react";

export const agents = [
  {
    id: "strict",
    title: "Строгий Юрист",
    description: "Точный анализ по букве закона",
    icon: Scale,
    size: "large",
    prompt: "Действуй как строгий корпоративный юрист. ",
    tone: "strict",
  },
  {
    id: "consultant",
    title: "Консультант",
    description: "Понятно и дружелюбно",
    icon: Briefcase,
    size: "small",
    prompt: "Действуй как дружелюбный и понятный юридический консультант. ",
    tone: "friendly",
  },
  {
    id: "analyzer",
    title: "Аналитик",
    description: "Поиск рисков",
    icon: FileSearch,
    size: "small",
    prompt:
      "Твоя задача - проверить документы на ошибки и риски. Будь дотошным. ",
    tone: "neutral",
  },
];
