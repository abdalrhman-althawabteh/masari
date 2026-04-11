const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function sendMessage(chatId: string, text: string, parseMode: "HTML" | "Markdown" = "HTML") {
  const res = await fetch(`${BASE_URL}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
    }),
  });
  return res.json();
}

export async function sendMessageWithInlineKeyboard(
  chatId: string,
  text: string,
  inlineKeyboard: Array<Array<{ text: string; callback_data: string }>>,
  parseMode: "HTML" | "Markdown" = "HTML"
) {
  const res = await fetch(`${BASE_URL}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
      reply_markup: { inline_keyboard: inlineKeyboard },
    }),
  });
  return res.json();
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  const res = await fetch(`${BASE_URL}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
    }),
  });
  return res.json();
}

export async function editMessageText(
  chatId: string,
  messageId: number,
  text: string,
  parseMode: "HTML" | "Markdown" = "HTML"
) {
  const res = await fetch(`${BASE_URL}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: parseMode,
    }),
  });
  return res.json();
}

export async function getFileUrl(fileId: string): Promise<string | null> {
  const res = await fetch(`${BASE_URL}/getFile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: fileId }),
  });
  const data = await res.json();
  if (data.ok && data.result?.file_path) {
    return `https://api.telegram.org/file/bot${BOT_TOKEN}/${data.result.file_path}`;
  }
  return null;
}

export async function downloadFileAsBase64(fileUrl: string): Promise<string> {
  const res = await fetch(fileUrl);
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

export async function downloadFileAsBuffer(fileUrl: string): Promise<Buffer> {
  const res = await fetch(fileUrl);
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer);
}

export async function setWebhook(url: string) {
  const body: Record<string, unknown> = {
    url,
    allowed_updates: ["message", "callback_query"],
  };
  if (process.env.TELEGRAM_WEBHOOK_SECRET) {
    body.secret_token = process.env.TELEGRAM_WEBHOOK_SECRET;
  }
  const res = await fetch(`${BASE_URL}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
    photo?: Array<{
      file_id: string;
      file_unique_id: string;
      width: number;
      height: number;
      file_size?: number;
    }>;
    caption?: string;
    voice?: {
      file_id: string;
      file_unique_id: string;
      duration: number;
      mime_type?: string;
      file_size?: number;
    };
    audio?: {
      file_id: string;
      file_unique_id: string;
      duration: number;
      mime_type?: string;
      file_size?: number;
    };
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    message?: {
      message_id: number;
      chat: {
        id: number;
        type: string;
      };
    };
    data?: string;
  };
}
