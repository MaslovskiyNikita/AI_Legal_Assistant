// src/utils/exportUtils.ts
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Header,
  Footer,
  AlignmentType,
  HeadingLevel,
} from "docx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";

const loadFontAsBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch font: ${response.status}`);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = (reader.result as string).split(",")[1];
      resolve(base64data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const exportToDocx = (
  messages: any[],
  filename: string = "chat-export.docx",
) => {
  const dateStr = new Date().toLocaleDateString("ru-RU");

  const doc = new Document({
    sections: [
      {
        // Брендированная шапка
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `AI Legal Expert | Сгенерировано: ${dateStr}`,
                    color: "8E8E93",
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
        },
        // Юридический подвал
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "Документ подготовлен с помощью нейросети. Рекомендуется финальная проверка юристом.",
                    color: "8E8E93",
                    size: 18,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Главный заголовок
          new Paragraph({
            text: "Отчет о сравнении документов",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          // Сообщения
          ...messages.map((msg) => {
            const prefix =
              msg.role === "user" ? "Пользователь" : "Legal Expert AI";
            const time = new Date(msg.created_at).toLocaleTimeString("ru-RU", {
              hour: "2-digit",
              minute: "2-digit",
            });
            return new Paragraph({
              children: [
                new TextRun({
                  text: `${prefix} (${time}):\n`,
                  bold: true,
                  size: 24,
                  color: msg.role === "ai" ? "3390EC" : "000000",
                }),
                new TextRun({ text: msg.text || msg.content || "", size: 22 }),
              ],
              spacing: { after: 300 },
            });
          }),
        ],
      },
    ],
  });
  Packer.toBlob(doc).then((blob) => saveAs(blob, filename));
};

export const exportToPdf = async (
  messages: any[],
  filename: string = "chat-export.pdf",
) => {
  const doc = new jsPDF();
  const FONT_REGULAR_URL =
    "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf";
  const FONT_BOLD_URL =
    "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Medium.ttf";

  try {
    const [regularFontBase64, boldFontBase64] = await Promise.all([
      loadFontAsBase64(FONT_REGULAR_URL),
      loadFontAsBase64(FONT_BOLD_URL),
    ]);
    doc.addFileToVFS("Roboto-Regular.ttf", regularFontBase64);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    doc.addFileToVFS("Roboto-Medium.ttf", boldFontBase64);
    doc.addFont("Roboto-Medium.ttf", "Roboto", "bold");
    doc.setFont("Roboto", "normal");
  } catch (error) {
    console.error("Font loading failed:", error);
    doc.setFont("helvetica");
  }

  let y = 20;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const maxWidth = doc.internal.pageSize.width - margin * 2;
  const dateStr = new Date().toLocaleDateString("ru-RU");

  // --- РИСУЕМ ШАПКУ ---
  doc.setFont("Roboto", "bold");
  doc.setFontSize(16);
  doc.setTextColor(51, 144, 236); // Синий цвет
  doc.text("AI Legal Expert", margin, y);

  doc.setFont("Roboto", "normal");
  doc.setFontSize(10);
  doc.setTextColor(142, 142, 147); // Серый цвет
  doc.text(
    `Сгенерировано: ${dateStr}`,
    doc.internal.pageSize.width - margin - 40,
    y,
  );

  y += 5;
  doc.setDrawColor(229, 229, 234);
  doc.line(margin, y, doc.internal.pageSize.width - margin, y); // Линия-разделитель
  y += 15;

  doc.setFont("Roboto", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Отчет о сравнении документов", doc.internal.pageSize.width / 2, y, {
    align: "center",
  });
  y += 15;

  // --- ПЕЧАТАЕМ СООБЩЕНИЯ ---
  messages.forEach((msg) => {
    const prefix = msg.role === "user" ? "Пользователь" : "Legal Expert AI";
    const time = new Date(msg.created_at).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const fullText = msg.text || msg.content || "";

    if (y > pageHeight - 40) {
      doc.addPage();
      y = margin + 10;
    }

    doc.setFont("Roboto", "bold");
    doc.setFontSize(11);
    doc.setTextColor(
      msg.role === "ai" ? 51 : 0,
      msg.role === "ai" ? 144 : 0,
      msg.role === "ai" ? 236 : 0,
    );
    doc.text(`${prefix} (${time}):`, margin, y);
    y += 6;

    doc.setFont("Roboto", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    const lines = doc.splitTextToSize(fullText, maxWidth);
    lines.forEach((line: string) => {
      if (y > pageHeight - 30) {
        doc.addPage();
        y = margin + 10;
      }
      doc.text(line, margin, y);
      y += 5;
    });
    y += 8;
  });

  // --- РИСУЕМ ПОДВАЛ ---
  if (y > pageHeight - 30) {
    doc.addPage();
    y = margin + 10;
  }
  y += 10;
  doc.setDrawColor(229, 229, 234);
  doc.line(margin, y, doc.internal.pageSize.width - margin, y);
  y += 8;
  doc.setFontSize(8);
  doc.setTextColor(142, 142, 147);
  doc.text(
    "Документ подготовлен с помощью нейросети. Рекомендуется финальная проверка юристом.",
    doc.internal.pageSize.width / 2,
    y,
    { align: "center" },
  );

  doc.save(filename);
};
