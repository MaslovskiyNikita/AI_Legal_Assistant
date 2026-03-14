import { Document, Packer, Paragraph, TextRun } from "docx";
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
  const doc = new Document({
    sections: [
      {
        children: messages.map((msg) => {
          const prefix =
            msg.role === "user" ? "Пользователь" : "Legal Expert AI";
          const time = new Date(msg.created_at).toLocaleString();
          return new Paragraph({
            children: [
              new TextRun({
                text: `${prefix} (${time}): `,
                bold: true,
                size: 22,
              }),
              new TextRun({ text: msg.text || msg.content || "", size: 22 }),
            ],
            spacing: { after: 200 },
          });
        }),
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

  // Используем надежные CDN ссылки, которые ТОЧНО содержат кириллицу (взято из pdfmake)
  const FONT_REGULAR_URL =
    "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf";
  const FONT_BOLD_URL =
    "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Medium.ttf";

  try {
    // Загружаем оба шрифта параллельно
    const [regularFontBase64, boldFontBase64] = await Promise.all([
      loadFontAsBase64(FONT_REGULAR_URL),
      loadFontAsBase64(FONT_BOLD_URL),
    ]);

    // Регистрируем обычный шрифт
    doc.addFileToVFS("Roboto-Regular.ttf", regularFontBase64);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");

    // Регистрируем жирный шрифт (чтобы заголовки выделялись красиво)
    doc.addFileToVFS("Roboto-Medium.ttf", boldFontBase64);
    doc.addFont("Roboto-Medium.ttf", "Roboto", "bold");

    doc.setFont("Roboto", "normal");
  } catch (error) {
    console.error("Font loading failed, falling back to Helvetica:", error);
    doc.setFont("helvetica"); // Внимание: Helvetica всё равно выдаст кракозябры для кириллицы
  }

  let y = 15;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const maxWidth = doc.internal.pageSize.width - margin * 2;

  messages.forEach((msg) => {
    const prefix = msg.role === "user" ? "Пользователь" : "Legal Expert AI";
    const time = new Date(msg.created_at).toLocaleString();
    const fullText = msg.text || msg.content || "";

    if (y > pageHeight - 30) {
      doc.addPage();
      y = margin;
    }

    // Печатаем заголовок (имя и время) жирным шрифтом
    doc.setFont("Roboto", "bold");
    doc.text(`${prefix} (${time}):`, margin, y);
    y += 8;

    // Печатаем текст сообщения обычным шрифтом
    doc.setFont("Roboto", "normal");

    // jsPDF корректно разобьет текст с кириллицей, т.к. шрифт теперь загружен правильно
    const lines = doc.splitTextToSize(fullText, maxWidth);

    lines.forEach((line: string) => {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 7;
    });

    y += 5; // Отступ между сообщениями
  });

  doc.save(filename);
};
