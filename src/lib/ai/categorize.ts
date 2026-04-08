import { chatCompletion, type AIProvider } from "./provider";

interface CategoryOption {
  id: string;
  name: string;
  icon: string | null;
}

interface CategorizationResult {
  category_id: string;
  category_name: string;
  confidence: "high" | "medium" | "low";
}

export async function categorizeTransaction(
  provider: AIProvider,
  apiKey: string,
  description: string,
  transactionType: "income" | "expense",
  categories: CategoryOption[]
): Promise<CategorizationResult | null> {
  if (!categories.length) return null;

  const categoryList = categories
    .map((c) => `${c.id}|${c.icon || ""} ${c.name}`)
    .join("\n");

  const response = await chatCompletion(provider, apiKey, [
    {
      role: "system",
      content: `You are a financial transaction categorizer. Given a transaction description, pick the single most appropriate category from the list provided.

Respond with ONLY a JSON object in this exact format (no markdown, no explanation):
{"category_id": "<uuid>", "category_name": "<name>", "confidence": "high|medium|low"}

Rules:
- "high" confidence: the description clearly matches (e.g., "Uber" → Transport)
- "medium" confidence: likely match but could be another category
- "low" confidence: best guess, unclear from description`,
    },
    {
      role: "user",
      content: `Transaction type: ${transactionType}
Description: "${description}"

Available categories:
${categoryList}`,
    },
  ], { temperature: 0.1, maxTokens: 100 });

  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    // Verify the category_id exists in our list
    const match = categories.find((c) => c.id === parsed.category_id);
    if (match) {
      return {
        category_id: parsed.category_id,
        category_name: parsed.category_name || match.name,
        confidence: parsed.confidence || "medium",
      };
    }
    // If AI returned a name but wrong ID, try to match by name
    const nameMatch = categories.find(
      (c) => c.name.toLowerCase() === (parsed.category_name || "").toLowerCase()
    );
    if (nameMatch) {
      return {
        category_id: nameMatch.id,
        category_name: nameMatch.name,
        confidence: parsed.confidence || "low",
      };
    }
  } catch {
    // AI response wasn't valid JSON — ignore
  }

  return null;
}
