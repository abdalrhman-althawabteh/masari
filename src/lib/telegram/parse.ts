import { chatCompletion, type AIProvider } from "@/lib/ai/provider";

interface ParsedTransaction {
  type: "income" | "expense";
  amount: number;
  currency: string;
  description: string;
  category_hint: string;
  source?: string;
  date?: string;
}

interface ParsedSubscription {
  name: string;
  amount: number;
  currency: string;
  billing_cycle: "monthly" | "yearly" | "weekly";
  category_hint: string;
  start_date?: string;
}

interface ParsedEditSubscription {
  name: string;
  new_name?: string;
  new_amount?: number;
  new_currency?: string;
  new_billing_cycle?: "monthly" | "yearly" | "weekly";
  new_start_date?: string;
}

interface ParsedBudget {
  amount: number;
  currency: string;
  category_hint?: string | null;
}

interface ParsedEditBudget {
  category_hint?: string | null;
  new_amount: number;
  new_currency?: string;
}

interface ParsedSavingsGoal {
  name: string;
  target_amount: number;
  currency: string;
  deadline?: string;
}

interface ParsedEditSavingsGoal {
  name: string;
  new_name?: string;
  new_target_amount?: number;
  new_deadline?: string;
}

interface ParsedContribution {
  goal_name: string;
  amount: number;
  currency: string;
}

interface ParsedDebt {
  direction: "i_owe" | "they_owe";
  person_name: string;
  amount: number;
  currency: string;
  reason?: string;
  due_date?: string;
}

interface ParsedEditDebt {
  person_name: string;
  new_amount?: number;
  new_due_date?: string;
  new_reason?: string;
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
  | "edit_subscription"
  | "cancel_subscription"
  | "set_budget"
  | "edit_budget"
  | "check_budget"
  | "create_savings_goal"
  | "edit_savings_goal"
  | "contribute_savings"
  | "check_savings"
  | "create_debt"
  | "edit_debt"
  | "list_debts"
  | "pay_debt"
  | "help"
  | "unknown";

export interface ParsedQuery {
  intent: Intent;
  transaction?: ParsedTransaction;
  subscription?: ParsedSubscription;
  edit_subscription?: ParsedEditSubscription;
  budget?: ParsedBudget;
  edit_budget?: ParsedEditBudget;
  savings_goal?: ParsedSavingsGoal;
  edit_savings_goal?: ParsedEditSavingsGoal;
  contribution?: ParsedContribution;
  debt?: ParsedDebt;
  edit_debt?: ParsedEditDebt;
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
  const today = new Date().toISOString().split("T")[0];

  const response = await chatCompletion(provider, apiKey, [
    {
      role: "system",
      content: `You are a personal finance assistant. You understand Arabic and English. Parse the message and respond with ONLY valid JSON (no markdown, no explanation).

TODAY'S DATE: ${today}
DEFAULT CURRENCY: ${defaultCurrency}

IMPORTANT RULES:
- When the user mentions a date like "beginning of May", "1/5", "May 1st", "اول الشهر الخامس", convert it to YYYY-MM-DD format.
- When the user says just a number like "200" without context, ask a follow-up question. Do NOT guess the intent.
- When the user says "edit", "change", "update", "عدل", "غير" — use the EDIT intent for the relevant feature.
- Names should be matched loosely. "ai course" and "AI Course" are the same thing.
- Arabic and English are both valid. "اضف اشتراك" = "add subscription".

INTENTS:

1. LOG TRANSACTION:
{"intent": "log_transaction", "transaction": {"type": "income"|"expense", "amount": number, "currency": "USD"|"JOD"|"EUR"|"GBP"|"SAR"|"AED"|"EGP"|"TRY"|"IQD"|"KWD"|"BHD"|"OMR"|"QAR"|"LBP"|"SYP"|"YER"|"MAD"|"TND"|"DZD"|"LYD"|"SDG", "description": "...", "category_hint": "...", "source": "client name or null", "date": "YYYY-MM-DD or null"}}

2. CREATE SUBSCRIPTION (with optional start_date):
{"intent": "create_subscription", "subscription": {"name": "...", "amount": number, "currency": "USD"|"JOD"|"EUR"|"GBP"|"SAR"|"AED"|"EGP"|"TRY"|"IQD"|"KWD"|"BHD"|"OMR"|"QAR"|"LBP"|"SYP"|"YER"|"MAD"|"TND"|"DZD"|"LYD"|"SDG", "billing_cycle": "monthly"|"yearly"|"weekly", "category_hint": "...", "start_date": "YYYY-MM-DD or null"}}

3. EDIT SUBSCRIPTION (change name, amount, billing date, etc.):
{"intent": "edit_subscription", "edit_subscription": {"name": "current name to find", "new_name": "...", "new_amount": number, "new_currency": "USD"|"JOD"|"EUR"|"GBP"|"SAR"|"AED"|"EGP"|"TRY"|"IQD"|"KWD"|"BHD"|"OMR"|"QAR"|"LBP"|"SYP"|"YER"|"MAD"|"TND"|"DZD"|"LYD"|"SDG", "new_billing_cycle": "...", "new_start_date": "YYYY-MM-DD"}}
Only include fields that are being changed.

4. LIST SUBSCRIPTIONS: {"intent": "list_subscriptions"}
5. CANCEL SUBSCRIPTION: {"intent": "cancel_subscription", "cancel_sub": {"name": "..."}}

6. SET BUDGET (category_hint null = overall):
{"intent": "set_budget", "budget": {"amount": number, "currency": "USD"|"JOD"|"EUR"|"GBP"|"SAR"|"AED"|"EGP"|"TRY"|"IQD"|"KWD"|"BHD"|"OMR"|"QAR"|"LBP"|"SYP"|"YER"|"MAD"|"TND"|"DZD"|"LYD"|"SDG", "category_hint": null|"category name"}}

7. EDIT BUDGET:
{"intent": "edit_budget", "edit_budget": {"category_hint": null|"category name", "new_amount": number, "new_currency": "USD"|"JOD"|"EUR"|"GBP"|"SAR"|"AED"|"EGP"|"TRY"|"IQD"|"KWD"|"BHD"|"OMR"|"QAR"|"LBP"|"SYP"|"YER"|"MAD"|"TND"|"DZD"|"LYD"|"SDG"}}

8. CHECK BUDGET: {"intent": "check_budget"}

9. CREATE SAVINGS GOAL:
{"intent": "create_savings_goal", "savings_goal": {"name": "...", "target_amount": number, "currency": "USD"|"JOD"|"EUR"|"GBP"|"SAR"|"AED"|"EGP"|"TRY"|"IQD"|"KWD"|"BHD"|"OMR"|"QAR"|"LBP"|"SYP"|"YER"|"MAD"|"TND"|"DZD"|"LYD"|"SDG", "deadline": "YYYY-MM-DD or null"}}

10. EDIT SAVINGS GOAL:
{"intent": "edit_savings_goal", "edit_savings_goal": {"name": "current name to find", "new_name": "...", "new_target_amount": number, "new_deadline": "YYYY-MM-DD"}}

11. CONTRIBUTE TO SAVINGS:
{"intent": "contribute_savings", "contribution": {"goal_name": "...", "amount": number, "currency": "USD"|"JOD"|"EUR"|"GBP"|"SAR"|"AED"|"EGP"|"TRY"|"IQD"|"KWD"|"BHD"|"OMR"|"QAR"|"LBP"|"SYP"|"YER"|"MAD"|"TND"|"DZD"|"LYD"|"SDG"}}

12. CHECK SAVINGS: {"intent": "check_savings"}

13. CREATE DEBT (with optional due_date):
{"intent": "create_debt", "debt": {"direction": "i_owe"|"they_owe", "person_name": "...", "amount": number, "currency": "USD"|"JOD"|"EUR"|"GBP"|"SAR"|"AED"|"EGP"|"TRY"|"IQD"|"KWD"|"BHD"|"OMR"|"QAR"|"LBP"|"SYP"|"YER"|"MAD"|"TND"|"DZD"|"LYD"|"SDG", "reason": "...", "due_date": "YYYY-MM-DD or null"}}

14. EDIT DEBT:
{"intent": "edit_debt", "edit_debt": {"person_name": "...", "new_amount": number, "new_due_date": "YYYY-MM-DD", "new_reason": "..."}}

15. LIST DEBTS: {"intent": "list_debts"}
16. PAY DEBT: {"intent": "pay_debt", "pay_debt": {"person_name": "..."}}

17. CHECK BALANCE: {"intent": "check_balance"}
18. TODAY SPENDING: {"intent": "today_spending"}
19. UPCOMING SUBS: {"intent": "upcoming_subs"}
20. HELP: {"intent": "help"}

If crucial info is missing, add "follow_up_question" in the language the user is speaking (Arabic or English).
Example: {"intent": "create_subscription", "follow_up_question": "What is the monthly cost for this subscription?"}

AMBIGUITY RULES:
- A lone number with no context → {"intent": "unknown", "follow_up_question": "What would you like to do with 200? Log a transaction, set a budget, or something else?"}
- "edit X" / "عدل X" → use the edit intent for whatever X is (subscription, budget, debt, goal)
- "change billing date of X to May 1" → edit_subscription with new_start_date
- Dates: "1/5" = May 1st, "اول الشهر الخامس" = May 1st of current year, "beginning of next month" = 1st of next month`,
    },
    { role: "user", content: text },
  ], { temperature: 0.1, maxTokens: 400 });

  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { intent: "unknown" };
  }
}

// Fuzzy name matching — case insensitive, partial match
export function fuzzyMatch(items: Array<{ id: string; name: string }>, query: string): { id: string; name: string } | null {
  const q = query.toLowerCase().trim();
  // Exact match first
  const exact = items.find((i) => i.name.toLowerCase() === q);
  if (exact) return exact;
  // Contains match
  const contains = items.find((i) => i.name.toLowerCase().includes(q) || q.includes(i.name.toLowerCase()));
  if (contains) return contains;
  // Word overlap match
  const qWords = q.split(/\s+/);
  let bestMatch: { id: string; name: string } | null = null;
  let bestScore = 0;
  for (const item of items) {
    const itemWords = item.name.toLowerCase().split(/\s+/);
    const overlap = qWords.filter((w) => itemWords.some((iw) => iw.includes(w) || w.includes(iw))).length;
    if (overlap > bestScore) {
      bestScore = overlap;
      bestMatch = item;
    }
  }
  return bestScore > 0 ? bestMatch : null;
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
  if (provider === "openai") return parseReceiptOpenAI(apiKey, imageBase64, defaultCurrency);
  if (provider === "anthropic") return parseReceiptAnthropic(apiKey, imageBase64, defaultCurrency);
  if (provider === "gemini") return parseReceiptGemini(apiKey, imageBase64, defaultCurrency);
  return null;
}

async function parseReceiptOpenAI(apiKey: string, imageBase64: string, defaultCurrency: string) {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: `Extract receipt data. ONLY JSON: {"store_name":"...","date":"YYYY-MM-DD","currency":"USD"|"JOD"|"EUR"|"GBP"|"SAR"|"AED"|"EGP"|"TRY"|"IQD"|"KWD"|"BHD"|"OMR"|"QAR"|"LBP"|"SYP"|"YER"|"MAD"|"TND"|"DZD"|"LYD"|"SDG","total":number,"category_hint":"..."}. Default currency: ${defaultCurrency}.` },
      { role: "user", content: [{ type: "text", text: "Extract:" }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }] },
    ],
    temperature: 0.1, max_tokens: 200,
  });
  try { return JSON.parse((response.choices[0]?.message?.content || "").replace(/```json\n?|\n?```/g, "").trim()); } catch { return null; }
}

async function parseReceiptAnthropic(apiKey: string, imageBase64: string, defaultCurrency: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514", max_tokens: 200, temperature: 0.1,
      system: `Extract receipt data. ONLY JSON: {"store_name":"...","date":"YYYY-MM-DD","currency":"USD"|"JOD"|"EUR"|"GBP"|"SAR"|"AED"|"EGP"|"TRY"|"IQD"|"KWD"|"BHD"|"OMR"|"QAR"|"LBP"|"SYP"|"YER"|"MAD"|"TND"|"DZD"|"LYD"|"SDG","total":number,"category_hint":"..."}. Default currency: ${defaultCurrency}.`,
      messages: [{ role: "user", content: [{ type: "text", text: "Extract:" }, { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } }] }],
    }),
  });
  const data = await res.json();
  try { return JSON.parse((data.content?.[0]?.text || "").replace(/```json\n?|\n?```/g, "").trim()); } catch { return null; }
}

async function parseReceiptGemini(apiKey: string, imageBase64: string, defaultCurrency: string) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: `Extract receipt. ONLY JSON: {"store_name":"...","date":"YYYY-MM-DD","currency":"USD"|"JOD"|"EUR"|"GBP"|"SAR"|"AED"|"EGP"|"TRY"|"IQD"|"KWD"|"BHD"|"OMR"|"QAR"|"LBP"|"SYP"|"YER"|"MAD"|"TND"|"DZD"|"LYD"|"SDG","total":number,"category_hint":"..."}. Default: ${defaultCurrency}.` }, { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 200 },
    }),
  });
  const data = await res.json();
  try { return JSON.parse((data.candidates?.[0]?.content?.parts?.[0]?.text || "").replace(/```json\n?|\n?```/g, "").trim()); } catch { return null; }
}
