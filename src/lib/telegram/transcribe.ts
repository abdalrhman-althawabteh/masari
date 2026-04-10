import type { AIProvider } from "@/lib/ai/provider";

export async function transcribeVoice(
  provider: AIProvider,
  apiKey: string,
  audioBuffer: Buffer,
  mimeType: string = "audio/ogg"
): Promise<string | null> {
  // OpenAI has the best transcription (Whisper)
  // For Anthropic/Gemini users, we still use OpenAI Whisper if they have the key,
  // otherwise fall back to Gemini's audio support
  if (provider === "openai") {
    return transcribeWithWhisper(apiKey, audioBuffer);
  } else if (provider === "gemini") {
    return transcribeWithGemini(apiKey, audioBuffer, mimeType);
  } else {
    // Anthropic doesn't have audio transcription — try a basic approach
    // by sending it to Gemini-style endpoint or return null
    return null;
  }
}

async function transcribeWithWhisper(apiKey: string, audioBuffer: Buffer): Promise<string | null> {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey });

  // Convert buffer to a File object for the API
  const uint8 = new Uint8Array(audioBuffer);
  const file = new File([uint8], "voice.ogg", { type: "audio/ogg" });

  try {
    const transcription = await client.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "ar", // Supports Arabic and English
    });

    return transcription.text || null;
  } catch {
    // Try without language hint (auto-detect)
    try {
      const transcription = await client.audio.transcriptions.create({
        file,
        model: "whisper-1",
      });
      return transcription.text || null;
    } catch {
      return null;
    }
  }
}

async function transcribeWithGemini(apiKey: string, audioBuffer: Buffer, mimeType: string): Promise<string | null> {
  const base64Audio = audioBuffer.toString("base64");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { text: "Transcribe this audio message exactly. Return ONLY the transcription text, nothing else. The audio may be in Arabic or English." },
            { inlineData: { mimeType: mimeType || "audio/ogg", data: base64Audio } },
          ],
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 500 },
      }),
    }
  );

  if (!response.ok) return null;

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
}
