// src/features/profile/data/agents.ts
import { Scale, Briefcase, FileSearch } from "lucide-react";

export const agents = [
  {
    id: "strict",
    title: "Строгий Юрист",
    description: "Точный анализ по букве закона",
    icon: Scale,
    size: "large",
    prompt: "Действуй как строгий корпоративный юрист. ",
  },
  {
    id: "consultant",
    title: "Консультант",
    description: "Понятно и дружелюбно",
    icon: Briefcase,
    size: "small",
    prompt: "Действуй как дружелюбный и понятный юридический консультант. ",
  },
  {
    id: "analyzer",
    title: "Аналитик",
    description: "Поиск рисков",
    icon: FileSearch,
    size: "small",
    prompt:
      "Твоя задача - проверить документы на ошибки и риски. Будь дотошным. ",
  },
];
