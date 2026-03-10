// app/api/client.ts

// Пока бэка нет, стучимся на локалхост (порт FastAPI по умолчанию)
const BASE_URL = "http://localhost:8000/api"; 

export const apiClient = {
  // Пример: отправить файлы на анализ
  async compareDocuments(files: File[]) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const response = await fetch(`${BASE_URL}/compare`, {
      method: "POST",
      body: formData,
    });
    return response.json();
  },

  // Пример: получить список диалогов юзера
  async getDialogues(userId: string) {
    const response = await fetch(`${BASE_URL}/dialogues/${userId}`);
    return response.json();
  }
};