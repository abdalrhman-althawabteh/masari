import { chatCompletion, type AIProvider } from "@/lib/ai/provider";

interface ParsedTransaction {
  type: "income" | "expense";
  amount: number;
  currency: "USD" | "JOD";
  description: string;
  category_hint: string;
  source?: string;
}

interface ParsedSubscription {
  name: string;
  amount: number;
  currency: "USD" | "JOD";
  billing_cycle: "monthly" | "yearly" | "weekly";
  category_hint: string;
}

interface ParsedBudget {
  amount: number;
  currency: "USD" | "JOD";
  category_hint?: string | null;
}

interface ParsedSavingsGoal {
  name: string;
  target_amount: number;
  currency: "USD" | "JOD";
}

interface ParsedContribution {
  goal_name: string;
  amount: number;
  currency: "USD" | "JOD";
}

interface ParsedDebt {
  direction: "i_owe" | "they_owe";
  person_name: string;
  amount: number;
  currency: "USD" | "JOD";
  reason?: string;
}

interface ParsedPayDebt {
  person_name: string;
}

interface ParsedCancelSub {
  name: string;
}

export type Intent =
  | "log_transaction"
  | "check_balance"
  | "today_spending"
  | "upcoming_subs"
  | "list_subscriptions"
  | "create_subscription"
  | "cancel_subscription"
  | "set_budget"
  | "check_budget"
  | "create_savings_goal"
  | "contribute_savings"
  | "check_savings"
  | "create_debt"
  | "list_debts"
  | "pay_debt"
  | "help"
  | "unknown";

export interface ParsedQuery {
  intent: Intent;
  transaction?: ParsedTransaction;
  subscription?: ParsedSubscription;
  budget?: ParsedBudget;
  savings_goal?: ParsedSavingsGoal;
  contribution?: ParsedContribution;
  debt?: ParsedDebt;
  pay_debt?: ParsedPayDebt;
  cancel_sub?: ParsedCancelSub;
  follow_up_question?: string;
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
      content: `You are a personal finance assistant that parses natural language messages. Respond with ONLY JSON (no markdown).

INTENTS AND FORMATS:

1. Log transaction:
{"intent": "log_transaction", "transaction": {"type": "income"|"expense", "amount": number, "currency": "USD"|"JOD", "description": "...", "category_hint": "...", "source": "..."}}

2. Create subscription:
{"intent": "create_subscription", "subscription": {"name": "...", "amount": number, "currency": "USD"|"JOD", "billing_cycle": "monthly"|"yearly"|"weekly", "category_hint": "..."}}

3. List subscriptions: {"intent": "list_subscriptions"}
4. Cancel subscription: {"intent": "cancel_subscription", "cancel_sub": {"name": "..."}}

5. Set budget (category_hint null = overall):
{"intent": "set_budget", "budget": {"amount": number, "currency": "USD"|"JOD", "category_hint": null|"category name"}}

6. Check budget: {"intent": "check_budget"}

7. Create savings goal:
{"intent": "create_savings_goal", "savings_goal": {"name": "...", "target_amount": number, "currency": "USD"|"JOD"}}

8. Contribute to savings:
{"intent": "contribute_savings", "contribution": {"goal_name": "...", "amount": number, "currency": "USD"|"JOD"}}

9. Check savings: {"intent": "check_savings"}

10. Create debt:
{"intent": "create_debt", "debt": {"direction": "i_owe"|"they_owe", "person_name": "...", "amount": number, "currency": "USD"|"JOD", "reason": "..."}}

11. List debts: {"intent": "list_debts"}
12. Pay debt: {"intent": "pay_debt", "pay_debt": {"person_name": "..."}}

13. Balance: {"intent": "check_balance"}
14. Today spending: {"intent": "today_spending"}
15. Upcoming subs: {"intent": "upcoming_subs"}
16. Help: {"intent": "help"}

If crucial info is missing and you can't guess it, add "follow_up_question" asking the user for the missing detail.
Example: {"intent": "create_subscription", "follow_up_question": "What's the monthly cost for GitHub?"}

Default currency: ${defaultCurrency}. If not specified, use ${defaultCurrency}.

PATTERNS:
- "Spent 15 on lunch" = log_transaction expense
- "Got 500 from Ahmed" = log_transaction income
- "Subscribe to GitHub 10 monthly" = create_subscription
- "Show subscriptions" = list_subscriptions
- "Cancel Netflix" = cancel_subscription
- "Set budget 500" = set_budget (overall)
- "Set food budget 200" = set_budget with category
- "How's my budget?" = check_budget
- "Save for Emergency Fund 5000" = create_savings_goal
- "Add 200 to Emergency Fund" = contribute_savings
- "How are my savings?" = check_savings
- "I owe Ahmed 50 for dinner" = create_debt i_owe
- "Ahmed owes me 100" = create_debt they_owe
- "Show debts" = list_debts
- "I paid Ahmed" or "Ahmed paid me" = pay_debt
- "Help" or "What can you do?" = help`,
    },
    { role: "user", content: text },
  ], { temperature: 0.1, maxTokens: 300 });

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
