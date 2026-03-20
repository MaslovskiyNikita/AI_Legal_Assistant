import React, { useState, useEffect } from "react";
import {
  Loader2,
  Trash2,
  ShieldCheck,
  BookOpen,
  ExternalLink,
  RefreshCw,
  Plus,
  UploadCloud,
  FileText,
  X,
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
  isKnowledgeBaseOpen: boolean;
  setIsKnowledgeBaseOpen: (val: boolean) => void;
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

export const SettingsModals: React.FC<SettingsModalsProps> = (props) => {
  const [customActs, setCustomActs] = useState<{ id: string; name: string }[]>(
    () => {
      const saved = localStorage.getItem("customActs");
      return saved ? JSON.parse(saved) : [];
    },
  );

  const [isAddActModalOpen, setIsAddActModalOpen] = useState(false);
  const [newActName, setNewActName] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");

  const handleAddCustomAct = () => {
    if (!newActName.trim()) return;
    const newAct = { id: Date.now().toString(), name: newActName };
    const updatedActs = [...customActs, newAct];
    setCustomActs(updatedActs);
    localStorage.setItem("customActs", JSON.stringify(updatedActs));
    setNewActName("");
    setUploadedFileName("");
    setIsAddActModalOpen(false);
  };

  const handleDeleteCustomAct = (id: string) => {
    tgHaptic("light");
    const updatedActs = customActs.filter((act) => act.id !== id);
    setCustomActs(updatedActs);
    localStorage.setItem("customActs", JSON.stringify(updatedActs));
  };

  return (
    <>
      {/* Очистка истории */}
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
            </div>

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
                  собирает, использует и защищает ваши данные.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-[15px] mb-1.5">
                  2. Отказ от ответственности
                </h3>
                <p className="opacity-90">
                  Сервис «Legal Expert» использует алгоритмы искусственного
                  интеллекта (LLM). Генерируемые ответы носят исключительно
                  информационно-рекомендательный характер.
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

            <div className="px-5 pb-3 pt-2 text-center border-b border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))] relative">
              <Drawer.Title className="text-[20px] font-bold text-[var(--tg-theme-text-color)]">
                База знаний (НПА)
              </Drawer.Title>
              <Drawer.Description className="text-[13px] text-[var(--tg-theme-hint-color)] mt-1">
                Источники, на которые опирается AI при анализе
              </Drawer.Description>
              <button
                onClick={() => {
                  tgHaptic("light");
                  setIsAddActModalOpen(true);
                }}
                className="absolute right-4 top-1 w-8 h-8 flex items-center justify-center bg-[color-mix(in_srgb,var(--tg-theme-button-color)_10%,transparent)] text-[var(--tg-theme-button-color)] rounded-full active:scale-95 transition-transform"
              >
                <Plus size={20} />
              </button>
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
                    Данные по статьям обновляются раз в сутки.
                  </p>
                </div>
              </div>

              {customActs.length > 0 && (
                <>
                  <h4 className="text-[13px] font-bold text-[var(--tg-theme-hint-color)] uppercase tracking-wider ml-1 mt-2">
                    Ваши загруженные
                  </h4>
                  <div className="bg-[var(--tg-theme-bg-color)] rounded-2xl shadow-sm border border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))] overflow-hidden flex flex-col">
                    {customActs.map((act) => (
                      <div
                        key={act.id}
                        className="flex items-center justify-between p-4 border-b border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))] last:border-0"
                      >
                        <div className="flex items-center gap-3 overflow-hidden pr-3">
                          <div className="w-8 h-8 rounded-lg bg-[color-mix(in_srgb,var(--tg-theme-button-color)_10%,transparent)] flex items-center justify-center shrink-0">
                            <FileText
                              size={16}
                              className="text-[var(--tg-theme-button-color)]"
                            />
                          </div>
                          <span className="text-[14px] font-medium text-[var(--tg-theme-text-color)] truncate">
                            {act.name}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteCustomAct(act.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-[#FF3B30]/10 text-[#FF3B30] active:scale-95 transition-transform shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <h4 className="text-[13px] font-bold text-[var(--tg-theme-hint-color)] uppercase tracking-wider ml-1 mt-2">
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
              <button
                onClick={() => {
                  tgHaptic("light");
                  setIsAddActModalOpen(true);
                }}
                className="w-full mb-3 py-3.5 bg-[color-mix(in_srgb,var(--tg-theme-button-color)_10%,transparent)] text-[var(--tg-theme-button-color)] font-semibold text-[17px] rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <Plus size={20} /> Загрузить свой документ
              </button>

              <Drawer.Close asChild>
                <button className="w-full py-4 bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)] font-semibold text-[17px] rounded-xl active:scale-[0.98] transition-all">
                  Закрыть
                </button>
              </Drawer.Close>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      <Drawer.Root open={isAddActModalOpen} onOpenChange={setIsAddActModalOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]" />
          <Drawer.Content
            className="bg-[var(--tg-theme-bg-color)] flex flex-col rounded-t-[24px] mt-24 fixed bottom-0 left-0 right-0 z-[80] outline-none"
            style={{ paddingBottom: "var(--safe-bottom)" }}
          >
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[var(--tg-theme-hint-color)] opacity-20 mt-4 mb-2" />

            <div className="px-5 pb-3 flex items-center justify-between border-b border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))]">
              <Drawer.Title className="text-[19px] font-bold text-[var(--tg-theme-text-color)]">
                Добавить НПА
              </Drawer.Title>
              <button
                onClick={() => setIsAddActModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center bg-[var(--tg-theme-secondary-bg-color)] rounded-full text-[var(--tg-theme-hint-color)] active:scale-95"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-[13px] font-bold text-[var(--tg-theme-hint-color)] uppercase tracking-wider block mb-2">
                  Название документа
                </label>
                <input
                  type="text"
                  placeholder="Например: Устав ООО 'Ромашка'"
                  value={newActName}
                  onChange={(e) => setNewActName(e.target.value)}
                  className="w-full bg-[var(--tg-theme-secondary-bg-color)] border border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))] rounded-xl px-4 py-3 text-[15px] text-[var(--tg-theme-text-color)] outline-none focus:border-[var(--tg-theme-button-color)] transition-colors"
                />
              </div>

              <div>
                <label className="text-[13px] font-bold text-[var(--tg-theme-hint-color)] uppercase tracking-wider block mb-2">
                  Файл документа
                </label>
                {/* Fake File Dropzone */}
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-[var(--tg-theme-section-separator-color,rgba(128,128,128,0.2))] rounded-xl bg-[var(--tg-theme-secondary-bg-color)] cursor-pointer active:opacity-80 transition-opacity">
                  <UploadCloud
                    size={28}
                    className="text-[var(--tg-theme-button-color)] mb-2"
                  />
                  <span className="text-[13px] font-medium text-[var(--tg-theme-text-color)] px-4 text-center truncate w-full">
                    {uploadedFileName
                      ? uploadedFileName
                      : "Выбрать файл (.pdf, .docx)"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        tgHaptic("light");
                        const name = e.target.files[0].name;
                        setUploadedFileName(name);
                        if (!newActName) {
                          setNewActName(name.replace(/\.[^/.]+$/, ""));
                        }
                      }
                    }}
                  />
                </label>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleAddCustomAct}
                  disabled={!newActName.trim() || !uploadedFileName}
                  className="w-full py-4 bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color,white)] rounded-xl text-[17px] font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform"
                >
                  Загрузить и сохранить
                </button>
                <p className="text-[12px] text-center text-[var(--tg-theme-hint-color)] mt-3">
                  Документ будет доступен в текущей сессии
                </p>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
};
