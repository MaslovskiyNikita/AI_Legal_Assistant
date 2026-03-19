import React from "react";
import {
  Loader2,
  Trash2,
  ShieldCheck,
  BookOpen,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { Drawer } from "vaul";
import { tgHaptic } from "../../../utils/telegram";

interface SettingsModalsProps {
  isClearHistoryModalOpen: boolean;
  setIsClearHistoryModalOpen: (val: boolean) => void;
  executeClearHistory: () => void;
  isClearing: boolean;
  isPrivacyModalOpen: boolean;
  setIsPrivacyModalOpen: (val: boolean) => void;
  isKnowledgeBaseOpen: boolean; // <-- ДОБАВИЛИ В ИНТЕРФЕЙС
  setIsKnowledgeBaseOpen: (val: boolean) => void; // <-- ДОБАВИЛИ В ИНТЕРФЕЙС
}

const KNOWLEDGE_BASE_LINKS = [
  {
    url: "https://pravo.by/pravovaya-informatsiya/normativnye-dokumenty/konstitutsiya-respubliki-belarus/",
    name: "Конституция Республики Беларусь",
  },
  {
    url: "https://pravo.by/document/?guid=3871&p0=Hk9900275",
    name: "Уголовный кодекс Республики Беларусь",
  },
  {
    url: "https://pravo.by/document/?guid=3871&p0=Hk9800218",
    name: "Гражданский кодекс Республики Беларусь",
  },
  {
    url: "https://pravo.by/document/?guid=3871&p0=HK9900296",
    name: "Трудовой кодекс Республики Беларусь",
  },
];

export const SettingsModals: React.FC<SettingsModalsProps> = (props) => (
  <>
    {/* 1. Шторка: Очистка истории */}
    <Drawer.Root
      open={props.isClearHistoryModalOpen}
      onOpenChange={(open) => {
        if (open) tgHaptic("light");
        props.setIsClearHistoryModalOpen(open);
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Drawer.Content
          className="bg-[var(--tg-theme-bg-color)] flex flex-col rounded-t-[24px] mt-24 fixed bottom-0 left-0 right-0 z-[60] outline-none"
          style={{ paddingBottom: "var(--safe-bottom)" }}
        >
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[var(--tg-theme-hint-color)] opacity-20 mt-4 mb-2" />

          <div className="p-5 pb-10">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-[#FFEBEA] rounded-full flex items-center justify-center mb-4">
                <Trash2 size={28} className="text-[#FF3B30]" />
              </div>
              <Drawer.Title className="text-[20px] font-bold text-[var(--tg-theme-text-color)] mb-2">
                Очистить историю?
              </Drawer.Title>
              <Drawer.Description className="text-[15px] text-[var(--tg-theme-hint-color)] leading-snug max-w-[280px]">
                Вы уверены, что хотите удалить все консультации? Это действие
                нельзя отменить.
              </Drawer.Description>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  tgHaptic("rigid");
                  props.executeClearHistory();
                }}
                disabled={props.isClearing}
                className="w-full py-4 bg-[#FF3B30] text-white rounded-xl text-[17px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                {props.isClearing ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  "Удалить все"
                )}
              </button>
              <Drawer.Close asChild>
                <button
                  disabled={props.isClearing}
                  className="w-full py-4 bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)] rounded-xl text-[17px] font-semibold active:scale-[0.98] transition-all"
                >
                  Отмена
                </button>
              </Drawer.Close>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>

    {/* 2. Шторка: Политика конфиденциальности */}
    <Drawer.Root
      open={props.isPrivacyModalOpen}
      onOpenChange={(open) => {
        if (open) tgHaptic("light");
        props.setIsPrivacyModalOpen(open);
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Drawer.Content
          className="bg-[var(--tg-theme-bg-color)] flex flex-col rounded-t-[24px] mt-10 fixed bottom-0 left-0 right-0 z-[60] outline-none h-[90vh]"
          style={{ paddingBottom: "var(--safe-bottom)" }}
        >
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[var(--tg-theme-hint-color)] opacity-20 mt-4 mb-2" />

          <div className="px-5 pb-3 border-b border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))] flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-[color-mix(in_srgb,var(--tg-theme-button-color)_10%,transparent)] text-[var(--tg-theme-button-color)] flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <Drawer.Title className="text-[19px] font-bold text-[var(--tg-theme-text-color)] leading-tight">
              Политика конфиденциальности
            </Drawer.Title>
            <Drawer.Description className="sr-only">
              Текст политики конфиденциальности
            </Drawer.Description>
          </div>

          {/* ТЕКСТ ПОЛИТИКИ */}
          <div className="flex-1 overflow-y-auto p-5 text-[14px] leading-relaxed text-[var(--tg-theme-text-color)] space-y-5">
            <p className="text-[12px] text-[var(--tg-theme-hint-color)] font-semibold uppercase tracking-wider">
              Редакция от: {new Date().toLocaleDateString("ru-RU")}
            </p>

            <div>
              <h3 className="font-bold text-[15px] mb-1.5">
                1. Общие положения
              </h3>
              <p className="opacity-90">
                Настоящая Политика описывает, как AI-ассистент «Legal Expert»
                (далее — Сервис) собирает, использует и защищает ваши данные.
                Использование Сервиса означает ваше согласие с данными
                условиями.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[15px] mb-1.5">
                2. Какие данные мы собираем
              </h3>
              <ul className="list-disc pl-4 space-y-1 opacity-90">
                <li>
                  <span className="font-semibold">
                    Данные профиля Telegram:
                  </span>{" "}
                  ID, имя, username, фото профиля (необходимы для авторизации).
                </li>
                <li>
                  <span className="font-semibold">
                    Пользовательский контент:
                  </span>{" "}
                  тексты запросов и загружаемые документы (.docx, .pdf).
                </li>
                <li>
                  <span className="font-semibold">История взаимодействий:</span>{" "}
                  результаты аудита рисков и диалоги с AI-ассистентом.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-[15px] mb-1.5">
                3. Обработка загружаемых документов
              </h3>
              <p className="opacity-90 mb-2">
                Мы понимаем чувствительность юридических документов. Сервис
                работает по следующим принципам:
              </p>
              <ul className="list-disc pl-4 space-y-1 opacity-90">
                <li>Документы передаются по зашифрованному каналу (HTTPS).</li>
                <li>
                  Для генерации отчетов тексты временно передаются сторонним
                  провайдерам ИИ (LLM API). Данные передаются строго для
                  обработки текущего запроса и{" "}
                  <span className="font-semibold">не используются</span> для
                  обучения публичных нейросетей.
                </li>
                <li>
                  Документы сохраняются на наших серверах исключительно для
                  того, чтобы вы имели к ним доступ в истории чатов.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-[15px] mb-1.5">
                4. Ваши права и удаление данных
              </h3>
              <p className="opacity-90">
                Вы являетесь полноправным владельцем своих данных. Вы в любой
                момент можете удалить отдельные чаты или полностью очистить
                историю запросов в разделе «Настройки». При удалении чата все
                связанные с ним документы и переписка{" "}
                <span className="font-semibold text-[#FF3B30]">
                  безвозвратно удаляются
                </span>{" "}
                с наших серверов.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[15px] mb-1.5">
                5. Оплата и транзакции
              </h3>
              <p className="opacity-90">
                Оплата токенов производится через внутреннюю систему Telegram
                Stars. Сервис не собирает, не обрабатывает и не хранит данные
                ваших банковских карт.
              </p>
            </div>

            <div className="pb-4">
              <h3 className="font-bold text-[15px] mb-1.5">6. Контакты</h3>
              <p className="opacity-90">
                Команда разработки (AI HACKATHON: BSUIR 2026).
                <br />
                По вопросам конфиденциальности:{" "}
                <a
                  href="mailto:science@bsuir.by"
                  className="text-[var(--tg-theme-button-color)] underline"
                >
                  science@bsuir.by
                </a>
              </p>
            </div>
          </div>

          <div className="p-4 border-t border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))] bg-[var(--tg-theme-bg-color)] shrink-0">
            <Drawer.Close asChild>
              <button className="w-full py-3.5 bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color,white)] font-semibold text-[17px] rounded-xl active:scale-[0.98] transition-all">
                Я согласен(на)
              </button>
            </Drawer.Close>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
    {/* 3. Шторка: БАЗА ЗНАНИЙ */}
    <Drawer.Root
      open={props.isKnowledgeBaseOpen}
      onOpenChange={(open) => {
        if (open) tgHaptic("light");
        props.setIsKnowledgeBaseOpen(open);
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Drawer.Content
          className="bg-[var(--tg-theme-secondary-bg-color)] flex flex-col rounded-t-[24px] mt-10 fixed bottom-0 left-0 right-0 z-[60] outline-none h-[85vh]"
          style={{ paddingBottom: "var(--safe-bottom)" }}
        >
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[var(--tg-theme-hint-color)] opacity-20 mt-4 mb-2" />

          <div className="px-5 pb-3 pt-2 text-center border-b border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))]">
            <Drawer.Title className="text-[20px] font-bold text-[var(--tg-theme-text-color)]">
              База знаний (НПА)
            </Drawer.Title>
            <Drawer.Description className="text-[13px] text-[var(--tg-theme-hint-color)] mt-1">
              Источники, на которые опирается AI при анализе
            </Drawer.Description>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-[var(--tg-theme-bg-color)] rounded-2xl p-4 shadow-sm border border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))] flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[color-mix(in_srgb,var(--tg-theme-button-color)_10%,transparent)] text-[var(--tg-theme-button-color)] flex items-center justify-center shrink-0 mt-0.5">
                <RefreshCw size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-[15px] font-semibold text-[var(--tg-theme-text-color)] leading-tight mb-1">
                  Синхронизация с pravo.by
                </h4>
                <p className="text-[13px] text-[var(--tg-theme-hint-color)] leading-snug">
                  Данные по статьям обновляются раз в сутки. Парсер считывает
                  код страницы, переводит его в хэш и сравнивает с текущей
                  версией. При расхождении хэшей база переиндексируется.
                </p>
              </div>
            </div>

            <h4 className="text-[13px] font-bold text-[var(--tg-theme-hint-color)] uppercase tracking-wider ml-1">
              Используемые документы
            </h4>

            <div className="bg-[var(--tg-theme-bg-color)] rounded-2xl shadow-sm border border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))] overflow-hidden flex flex-col">
              {KNOWLEDGE_BASE_LINKS.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 border-b border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))] last:border-0 active:bg-[var(--tg-theme-secondary-bg-color)] transition-colors"
                  onClick={() => tgHaptic("light")}
                >
                  <div className="flex items-center gap-3 overflow-hidden pr-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--tg-theme-secondary-bg-color)] flex items-center justify-center shrink-0">
                      <BookOpen
                        size={16}
                        className="text-[var(--tg-theme-text-color)] opacity-70"
                      />
                    </div>
                    <span className="text-[14px] font-medium text-[var(--tg-theme-text-color)] truncate">
                      {link.name}
                    </span>
                  </div>
                  <ExternalLink
                    size={16}
                    className="text-[var(--tg-theme-hint-color)] shrink-0"
                  />
                </a>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))] bg-[var(--tg-theme-bg-color)]">
            <Drawer.Close asChild>
              <button className="w-full py-4 bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color,white)] font-semibold text-[17px] rounded-xl active:scale-[0.98] transition-all">
                Закрыть
              </button>
            </Drawer.Close>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  </>
);
