import OpenAI from "openai";

export type AIProvider = "openai" | "anthropic" | "gemini";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
}

export async function chatCompletion(
  provider: AIProvider,
  apiKey: string,
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  const { temperature = 0.3, maxTokens = 500 } = options;

  switch (provider) {
    case "openai":
      return openaiChat(apiKey, messages, temperature, maxTokens);
    case "anthropic":
      return anthropicChat(apiKey, messages, temperature, maxTokens);
    case "gemini":
      return geminiChat(apiKey, messages, temperature, maxTokens);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

async function openaiChat(
  apiKey: string,
  messages: ChatMessage[],
  temperature: number,
  maxTokens: number
): Promise<string> {
  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature,
    max_tokens: maxTokens,
  });
  return response.choices[0]?.message?.content?.trim() || "";
}

async function anthropicChat(
  apiKey: string,
  messages: ChatMessage[],
  temperature: number,
  maxTokens: number
): Promise<string> {
  const systemMsg = messages.find((m) => m.role === "system");
  const nonSystemMsgs = messages.filter((m) => m.role !== "system");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      temperature,
      system: systemMsg?.content || "",
      messages: nonSystemMsgs.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error: ${err}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text?.trim() || "";
}

async function geminiChat(
  apiKey: string,
  messages: ChatMessage[],
  temperature: number,
  maxTokens: number
): Promise<string> {
  const systemMsg = messages.find((m) => m.role === "system");
  const nonSystemMsgs = messages.filter((m) => m.role !== "system");

  const contents = nonSystemMsgs.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: systemMsg
          ? { parts: [{ text: systemMsg.content }] }
          : undefined,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${err}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

export function getApiKey(
  provider: AIProvider,
  profile: {
    openai_api_key: string | null;
    anthropic_api_key: string | null;
    gemini_api_key: string | null;
  }
): string | null {
  switch (provider) {
    case "openai":
      return profile.openai_api_key;
    case "anthropic":
      return profile.anthropic_api_key;
    case "gemini":
      return profile.gemini_api_key;
    default:
      return null;
  }
}
