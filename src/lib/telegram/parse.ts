import { chatCompletion, getApiKey, type AIProvider } from "@/lib/ai/provider";

interface ParsedTransaction {
  type: "income" | "expense";
  amount: number;
  currency: "USD" | "JOD";
  description: string;
  category_hint: string;
  source?: string;
}

interface ParsedQuery {
  intent: "log_transaction" | "check_balance" | "today_spending" | "upcoming_subs" | "unknown";
  transaction?: ParsedTransaction;
}

export async function parseMessage(
  provider: AIProvider,
  apiKey: string,
  text: string,
  defaultCurrency: string
): Promise<ParsedQuery> {
  const response = await chatCompletion(provider, apiKey, [
    {
      role: "system",
      content: `You parse natural language financial messages. Respond with ONLY JSON (no markdown).

If the user is logging a transaction:
{
  "intent": "log_transaction",
  "transaction": {
    "type": "income" or "expense",
    "amount": number,
    "currency": "USD" or "JOD",
    "description": "short description",
    "category_hint": "best category name guess (e.g. Food & Dining, Transport, etc.)",
    "source": "client/source name if income, null if expense"
  }
}

If asking about balance: {"intent": "check_balance"}
If asking about today's spending: {"intent": "today_spending"}
If asking about subscriptions: {"intent": "upcoming_subs"}
Otherwise: {"intent": "unknown"}

Default currency is ${defaultCurrency}. If the user doesn't specify currency, use ${defaultCurrency}.
Common patterns:
- "Spent 15 on lunch" → expense
- "Got 500 from Ahmed" → income
- "Uber 8.50" → expense, Transport
- "Coffee 3 JOD" → expense, Food & Dining`,
    },
    { role: "user", content: text },
  ], { temperature: 0.1, maxTokens: 200 });

  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { intent: "unknown" };
  }
}

export async function parseReceipt(
  provider: AIProvider,
  apiKey: string,
  imageBase64: string,
  defaultCurrency: string
): Promise<{
  store_name: string;
  date: string;
  currency: string;
  total: number;
  category_hint: string;
} | null> {
  // Only OpenAI and Anthropic support vision
  if (provider === "openai") {
    return parseReceiptOpenAI(apiKey, imageBase64, defaultCurrency);
  } else if (provider === "anthropic") {
    return parseReceiptAnthropic(apiKey, imageBase64, defaultCurrency);
  } else if (provider === "gemini") {
    return parseReceiptGemini(apiKey, imageBase64, defaultCurrency);
  }
  return null;
}

async function parseReceiptOpenAI(apiKey: string, imageBase64: string, defaultCurrency: string) {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey });

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Extract receipt data. Respond with ONLY JSON: {"store_name": "...", "date": "YYYY-MM-DD", "currency": "USD" or "JOD", "total": number, "category_hint": "best category"}. Default currency: ${defaultCurrency}. If date is unclear, use today.`,
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Extract the total and details from this receipt:" },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        ],
      },
    ],
    temperature: 0.1,
    max_tokens: 200,
  });

  try {
    const text = response.choices[0]?.message?.content?.trim() || "";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

async function parseReceiptAnthropic(apiKey: string, imageBase64: string, defaultCurrency: string) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      temperature: 0.1,
      system: `Extract receipt data. Respond with ONLY JSON: {"store_name": "...", "date": "YYYY-MM-DD", "currency": "USD" or "JOD", "total": number, "category_hint": "best category"}. Default currency: ${defaultCurrency}.`,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "Extract the total and details from this receipt:" },
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
        ],
      }],
    }),
  });

  const data = await response.json();
  try {
    const text = data.content?.[0]?.text?.trim() || "";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

async function parseReceiptGemini(apiKey: string, imageBase64: string, defaultCurrency: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { text: `Extract receipt data. Respond with ONLY JSON: {"store_name": "...", "date": "YYYY-MM-DD", "currency": "USD" or "JOD", "total": number, "category_hint": "best category"}. Default currency: ${defaultCurrency}. Extract the total and details from this receipt:` },
            { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
          ],
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 200 },
      }),
    }
  );

  const data = await response.json();
  try {
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}
