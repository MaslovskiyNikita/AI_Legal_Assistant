// frontend/src/mocks/mockApi.ts
export async function auth(payload: any) {
  return new Promise((resolve) =>
    setTimeout(() => resolve({ user_id: 2, is_new_user: true }), 250),
  );
}

export async function getUser(telegram_id: number) {
  // если telegram_id известен (12345678) — возвращаем профиль,
  // иначе — имитируем 404 (пользователь не найден).
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      if (telegram_id === 12345678) {
        resolve({
          telegram_id,
          username: "demo_user",
          first_name: "Boris",
          last_name: "Erzhanovich",
          photo_url:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200",
        });
      } else {
        // бросаем ошибку похожую на fetch/axios 404
        const err: any = new Error("Пользователь не найден");
        err.status = 404;
        err.response = { data: { detail: "Пользователь не найден" } };
        reject(err);
      }
    }, 200),
  );
}

export async function ping() {
  return new Promise((resolve) =>
    setTimeout(() => resolve({ status: "ok" }), 50),
  );
}

export async function compareDocuments(files: File[]) {
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          summary: "Mock comparison complete",
          issues_found: 0,
          details: [],
        }),
      300,
    ),
  );
}

export async function getDialogues(userId: string) {
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve([
          {
            id: "1",
            title: "NDA Review - Apple Inc.",
            last_message: "Done",
            time: "12:30",
          },
          {
            id: "2",
            title: "Divorce proceeding laws",
            last_message: "See notes",
            time: "Yesterday",
          },
        ]),
      180,
    ),
  );
}

export default {
  auth,
  getUser,
  ping,
  compareDocuments,
  getDialogues,
};
