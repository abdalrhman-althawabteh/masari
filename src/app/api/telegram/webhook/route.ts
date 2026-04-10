import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMessage, getFileUrl, downloadFileAsBase64, setWebhook, type TelegramUpdate } from "@/lib/telegram/bot";
import { parseMessage, parseReceipt, fuzzyMatch, type ParsedQuery } from "@/lib/telegram/parse";
import { getApiKey, type AIProvider } from "@/lib/ai/provider";
import { formatCurrency, convertCurrency, type Currency } from "@/lib/currency";
import { startOfMonth, endOfMonth, format, addDays, addMonths } from "date-fns";
import type { Database } from "@/types/database";

function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const update: TelegramUpdate = await request.json();
  const message = update.message;

  if (!message) return NextResponse.json({ ok: true });

  const chatId = String(message.chat.id);
  const supabase = createAdminClient();

  // Find user by telegram_chat_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("telegram_chat_id", chatId)
    .maybeSingle();

  // Handle link code for unlinked users
  if (message.text && !profile) {
    const code = message.text.trim();
    if (/^\d{6}$/.test(code)) {
      const { data: linkProfile } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("telegram_token", code)
        .maybeSingle();

      if (linkProfile) {
        await supabase
          .from("profiles")
          .update({ telegram_chat_id: chatId, telegram_token: null })
          .eq("id", linkProfile.id);

        await sendMessage(chatId,
          `<b>Linked!</b> Welcome ${linkProfile.name || ""}!\n\nSend me anything like:\n- <i>Spent 15 JOD on lunch</i>\n- <i>Add subscription Netflix $15 monthly</i>\n- <i>Set budget 500 JOD</i>\n- <i>I owe Ahmed 50 JOD</i>\n- <i>Help</i> for all commands`
        );
        return NextResponse.json({ ok: true });
      }
    }

    await sendMessage(chatId,
      "Welcome to <b>Masari</b>!\n\nTo link your account:\n1. Go to Settings in the app\n2. Click \"Link Telegram\"\n3. Send me the 6-digit code"
    );
    return NextResponse.json({ ok: true });
  }

  if (!profile) {
    await sendMessage(chatId, "Please link your account first. Go to Settings in the Masari app.");
    return NextResponse.json({ ok: true });
  }

  const provider = (profile.ai_provider || "openai") as AIProvider;
  const apiKey = getApiKey(provider, profile);
  const defaultCurrency = (profile.default_currency || "USD") as Currency;
  const exchangeRate = profile.exchange_rate || 0.709;

  function toDefault(amount: number, currency: string): number {
    return convertCurrency(amount, currency as Currency, defaultCurrency, exchangeRate);
  }

  // Handle photo (receipt scanning) — unchanged
  if (message.photo && message.photo.length > 0) {
    if (!apiKey) {
      await sendMessage(chatId, "No AI API key configured. Add one in Settings.");
      return NextResponse.json({ ok: true });
    }

    await sendMessage(chatId, "Scanning receipt...");
    const largestPhoto = message.photo[message.photo.length - 1];
    const fileUrl = await getFileUrl(largestPhoto.file_id);

    if (!fileUrl) {
      await sendMessage(chatId, "Couldn't download the image. Please try again.");
      return NextResponse.json({ ok: true });
    }

    try {
      const base64 = await downloadFileAsBase64(fileUrl);
      const receipt = await parseReceipt(provider, apiKey, base64, defaultCurrency);

      if (!receipt || !receipt.total) {
        await sendMessage(chatId, "Couldn't read the receipt. Try a clearer photo.");
        return NextResponse.json({ ok: true });
      }

      const category = await findCategory(supabase, profile.id, receipt.category_hint || "", "expense");

      if (!category) {
        await sendMessage(chatId, "No categories found.");
        return NextResponse.json({ ok: true });
      }

      await supabase.from("transactions").insert({
        user_id: profile.id,
        type: "expense",
        amount: receipt.total,
        currency: receipt.currency || defaultCurrency,
        category_id: category.id,
        description: `${receipt.store_name || "Receipt"} (scanned)`,
        date: receipt.date || format(new Date(), "yyyy-MM-dd"),
        created_via: "telegram",
      });

      await sendMessage(chatId,
        `<b>Receipt logged!</b>\n${receipt.store_name || "Store"}\n${formatCurrency(receipt.total, (receipt.currency || defaultCurrency) as Currency)}\n${category.name}\n${receipt.date || "Today"}`
      );
    } catch (err) {
      await sendMessage(chatId, `Error: ${err instanceof Error ? err.message : "Unknown"}`);
    }
    return NextResponse.json({ ok: true });
  }

  // Handle text
  if (!message.text) return NextResponse.json({ ok: true });
  const text = message.text.trim();

  // Handle /start
  if (text === "/start") {
    await sendMessage(chatId, getHelpText(profile.name || ""));
    return NextResponse.json({ ok: true });
  }

  if (!apiKey) {
    await sendMessage(chatId, "No AI API key configured. Add one in Settings.");
    return NextResponse.json({ ok: true });
  }

  try {
    const parsed = await parseMessage(provider, apiKey, text, defaultCurrency);

    // If AI needs more info, ask the follow-up
    if (parsed.follow_up_question) {
      await sendMessage(chatId, parsed.follow_up_question);
      return NextResponse.json({ ok: true });
    }

    switch (parsed.intent) {
      case "log_transaction":
        await handleLogTransaction(supabase, chatId, profile, parsed);
        break;

      case "check_balance":
        await handleCheckBalance(supabase, chatId, profile, defaultCurrency, toDefault);
        break;

      case "today_spending":
        await handleTodaySpending(supabase, chatId, profile, defaultCurrency, toDefault);
        break;

      case "upcoming_subs":
        await handleUpcomingSubs(supabase, chatId, profile, defaultCurrency);
        break;

      case "create_subscription":
        await handleCreateSubscription(supabase, chatId, profile, parsed);
        break;

      case "list_subscriptions":
        await handleListSubscriptions(supabase, chatId, profile, defaultCurrency);
        break;

      case "cancel_subscription":
        await handleCancelSubscription(supabase, chatId, profile, parsed);
        break;

      case "edit_subscription":
        await handleEditSubscription(supabase, chatId, profile, parsed);
        break;

      case "set_budget":
        await handleSetBudget(supabase, chatId, profile, parsed);
        break;

      case "edit_budget":
        await handleEditBudget(supabase, chatId, profile, parsed, toDefault);
        break;

      case "check_budget":
        await handleCheckBudget(supabase, chatId, profile, defaultCurrency, toDefault);
        break;

      case "create_savings_goal":
        await handleCreateSavingsGoal(supabase, chatId, profile, parsed);
        break;

      case "edit_savings_goal":
        await handleEditSavingsGoal(supabase, chatId, profile, parsed);
        break;

      case "contribute_savings":
        await handleContributeSavings(supabase, chatId, profile, parsed);
        break;

      case "check_savings":
        await handleCheckSavings(supabase, chatId, profile);
        break;

      case "create_debt":
        await handleCreateDebt(supabase, chatId, profile, parsed);
        break;

      case "edit_debt":
        await handleEditDebt(supabase, chatId, profile, parsed);
        break;

      case "list_debts":
        await handleListDebts(supabase, chatId, profile, defaultCurrency, toDefault);
        break;

      case "pay_debt":
        await handlePayDebt(supabase, chatId, profile, parsed);
        break;

      case "help":
        await sendMessage(chatId, getHelpText(profile.name || ""));
        break;

      default:
        await sendMessage(chatId,
          "I didn't understand that. Try <i>Help</i> to see what I can do."
        );
    }
  } catch (err) {
    await sendMessage(chatId, `Error: ${err instanceof Error ? err.message : "Something went wrong"}`);
  }

  return NextResponse.json({ ok: true });
}

// ============ HELPERS ============

type SupabaseClient = ReturnType<typeof createAdminClient>;
type Profile = { id: string; name: string | null; default_currency: string; exchange_rate: number; [key: string]: unknown };

async function findCategory(supabase: SupabaseClient, userId: string, hint: string, type: string) {
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("user_id", userId)
    .or(`type.eq.${type},type.eq.both`);

  if (!categories?.length) return null;

  const match = categories.find(
    (c) => c.name.toLowerCase().includes(hint.toLowerCase())
  );
  return match || categories[categories.length - 1];
}

function getHelpText(name: string): string {
  return `Hey ${name}! Here's what I can do:\n
<b>Transactions</b>
- <i>Spent 15 JOD on lunch</i>
- <i>Got 500 USD from client</i>
- <i>What's my balance?</i>
- <i>How much did I spend today?</i>
- Send a <b>receipt photo</b>

<b>Subscriptions</b>
- <i>Add subscription Netflix $15 monthly starting May 1st</i>
- <i>Show my subscriptions</i>
- <i>Edit Netflix billing date to June 1st</i>
- <i>Cancel Netflix</i>

<b>Budgets</b>
- <i>Set budget 500 JOD</i>
- <i>Set food budget 200 JOD</i>
- <i>Change budget to 600</i>
- <i>How's my budget?</i>

<b>Savings</b>
- <i>Create savings goal Emergency Fund 5000 USD</i>
- <i>Add 200 to Emergency Fund</i>
- <i>Edit Emergency Fund target to 8000</i>
- <i>How are my savings?</i>

<b>Debts</b>
- <i>I owe Ahmed 50 JOD for dinner, due May 15th</i>
- <i>Ahmed owes me 100 USD</i>
- <i>Edit Ahmed's debt to 80 JOD</i>
- <i>Show my debts</i>
- <i>I paid Ahmed</i>

I understand both Arabic and English!`;
}

// ============ INTENT HANDLERS ============

async function handleLogTransaction(supabase: SupabaseClient, chatId: string, profile: Profile, parsed: ParsedQuery) {
  const tx = parsed.transaction;
  if (!tx) { await sendMessage(chatId, "Couldn't understand the transaction. Try: <i>Spent 15 JOD on lunch</i>"); return; }

  const category = await findCategory(supabase, profile.id, tx.category_hint || "", tx.type);
  if (!category) { await sendMessage(chatId, "No categories found."); return; }

  const { error } = await supabase.from("transactions").insert({
    user_id: profile.id, type: tx.type, amount: tx.amount, currency: tx.currency,
    category_id: category.id, description: tx.description, source: tx.source || null,
    date: format(new Date(), "yyyy-MM-dd"), created_via: "telegram",
  });

  if (error) { await sendMessage(chatId, `Error: ${error.message}`); return; }

  const sign = tx.type === "income" ? "+" : "-";
  await sendMessage(chatId,
    `<b>${tx.type === "income" ? "Income" : "Expense"} logged!</b>\n${sign}${formatCurrency(tx.amount, tx.currency as Currency)}\n${tx.description}\n${category.name}`
  );
}

async function handleCheckBalance(supabase: SupabaseClient, chatId: string, profile: Profile, defaultCurrency: Currency, toDefault: (a: number, c: string) => number) {
  const now = new Date();
  const { data: txs } = await supabase
    .from("transactions").select("type, amount, currency")
    .eq("user_id", profile.id)
    .gte("date", format(startOfMonth(now), "yyyy-MM-dd"))
    .lte("date", format(endOfMonth(now), "yyyy-MM-dd"));

  let income = 0, expenses = 0;
  for (const t of txs || []) { const c = toDefault(t.amount, t.currency); if (t.type === "income") income += c; else expenses += c; }

  await sendMessage(chatId,
    `<b>This month (${format(now, "MMMM yyyy")})</b>\n\nIncome: ${formatCurrency(income, defaultCurrency)}\nExpenses: ${formatCurrency(expenses, defaultCurrency)}\n${income - expenses >= 0 ? "+" : ""}Balance: ${formatCurrency(income - expenses, defaultCurrency)}`
  );
}

async function handleTodaySpending(supabase: SupabaseClient, chatId: string, profile: Profile, defaultCurrency: Currency, toDefault: (a: number, c: string) => number) {
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: txs } = await supabase
    .from("transactions").select("amount, currency, description")
    .eq("user_id", profile.id).eq("date", today).eq("type", "expense");

  if (!txs || txs.length === 0) { await sendMessage(chatId, "No spending today!"); return; }

  let total = 0;
  const lines = txs.map((t) => { const c = toDefault(t.amount, t.currency); total += c; return `- ${t.description}: ${formatCurrency(t.amount, t.currency as Currency)}`; });

  await sendMessage(chatId, `<b>Today's spending</b>\n\n${lines.join("\n")}\n\n<b>Total: ${formatCurrency(total, defaultCurrency)}</b>`);
}

async function handleUpcomingSubs(supabase: SupabaseClient, chatId: string, profile: Profile, defaultCurrency: Currency) {
  const today = format(new Date(), "yyyy-MM-dd");
  const weekLater = format(addDays(new Date(), 7), "yyyy-MM-dd");

  const { data: subs } = await supabase
    .from("subscriptions").select("name, amount, currency, next_billing_date")
    .eq("user_id", profile.id).eq("status", "active")
    .gte("next_billing_date", today).lte("next_billing_date", weekLater)
    .order("next_billing_date");

  if (!subs || subs.length === 0) { await sendMessage(chatId, "No subscriptions renewing in the next 7 days."); return; }

  const lines = subs.map((s) => `- ${s.name}: ${formatCurrency(s.amount, s.currency as Currency)} on ${s.next_billing_date}`);
  await sendMessage(chatId, `<b>Upcoming renewals (7 days)</b>\n\n${lines.join("\n")}`);
}

async function handleCreateSubscription(supabase: SupabaseClient, chatId: string, profile: Profile, parsed: ParsedQuery) {
  const sub = parsed.subscription;
  if (!sub) { await sendMessage(chatId, "Couldn't understand. Try: <i>Add subscription Netflix $15 monthly</i>"); return; }

  const category = await findCategory(supabase, profile.id, sub.category_hint || "SaaS", "expense");
  if (!category) { await sendMessage(chatId, "No categories found."); return; }

  const nextDate = sub.start_date || format(addMonths(new Date(), 1), "yyyy-MM-dd");

  const { error } = await supabase.from("subscriptions").insert({
    user_id: profile.id, name: sub.name, amount: sub.amount, currency: sub.currency,
    category_id: category.id, billing_cycle: sub.billing_cycle, next_billing_date: nextDate, status: "active",
  });

  if (error) { await sendMessage(chatId, `Error: ${error.message}`); return; }

  await sendMessage(chatId,
    `<b>Subscription added!</b>\n${sub.name}\n${formatCurrency(sub.amount, sub.currency as Currency)} / ${sub.billing_cycle}\nNext billing: ${nextDate}`
  );
}

async function handleListSubscriptions(supabase: SupabaseClient, chatId: string, profile: Profile, defaultCurrency: Currency) {
  const { data: subs } = await supabase
    .from("subscriptions").select("name, amount, currency, billing_cycle, status, next_billing_date")
    .eq("user_id", profile.id).eq("status", "active").order("next_billing_date");

  if (!subs || subs.length === 0) { await sendMessage(chatId, "No active subscriptions."); return; }

  const lines = subs.map((s) =>
    `- <b>${s.name}</b>: ${formatCurrency(s.amount, s.currency as Currency)}/${s.billing_cycle} (next: ${s.next_billing_date})`
  );
  await sendMessage(chatId, `<b>Active Subscriptions (${subs.length})</b>\n\n${lines.join("\n")}`);
}

async function handleCancelSubscription(supabase: SupabaseClient, chatId: string, profile: Profile, parsed: ParsedQuery) {
  const name = parsed.cancel_sub?.name;
  if (!name) { await sendMessage(chatId, "Which subscription? Try: <i>Cancel Netflix</i>"); return; }

  const { data: allSubs } = await supabase
    .from("subscriptions").select("id, name")
    .eq("user_id", profile.id).eq("status", "active");

  const match = fuzzyMatch(allSubs || [], name);
  if (!match) { await sendMessage(chatId, `No active subscription matching "${name}".`); return; }
  const subs = [match];

  await supabase.from("subscriptions").update({ status: "cancelled" }).eq("id", subs[0].id);
  await sendMessage(chatId, `<b>${subs[0].name}</b> cancelled.`);
}

async function handleSetBudget(supabase: SupabaseClient, chatId: string, profile: Profile, parsed: ParsedQuery) {
  const budget = parsed.budget;
  if (!budget) { await sendMessage(chatId, "Try: <i>Set budget 500 JOD</i>"); return; }

  let categoryId: string | null = null;
  let categoryName = "Overall";

  if (budget.category_hint) {
    const cat = await findCategory(supabase, profile.id, budget.category_hint, "expense");
    if (cat) { categoryId = cat.id; categoryName = cat.name; }
  }

  // Upsert budget
  let query = supabase.from("budgets").select("id").eq("user_id", profile.id);
  if (categoryId) { query = query.eq("category_id", categoryId); } else { query = query.is("category_id", null); }
  const { data: existing } = await query.maybeSingle();

  if (existing) {
    await supabase.from("budgets").update({ amount: budget.amount, currency: budget.currency }).eq("id", existing.id);
  } else {
    await supabase.from("budgets").insert({
      user_id: profile.id, category_id: categoryId, amount: budget.amount, currency: budget.currency, period: "monthly",
    });
  }

  await sendMessage(chatId,
    `<b>Budget set!</b>\n${categoryName}: ${formatCurrency(budget.amount, budget.currency as Currency)} / month`
  );
}

async function handleCheckBudget(supabase: SupabaseClient, chatId: string, profile: Profile, defaultCurrency: Currency, toDefault: (a: number, c: string) => number) {
  const { data: budgets } = await supabase.from("budgets").select("amount, currency, category_id, categories(name)").eq("user_id", profile.id);

  if (!budgets || budgets.length === 0) { await sendMessage(chatId, "No budgets set. Try: <i>Set budget 500 JOD</i>"); return; }

  const now = new Date();
  const { data: txs } = await supabase.from("transactions").select("amount, currency, category_id")
    .eq("user_id", profile.id).eq("type", "expense")
    .gte("date", format(startOfMonth(now), "yyyy-MM-dd")).lte("date", format(endOfMonth(now), "yyyy-MM-dd"));

  let totalSpent = 0;
  const spentByCategory: Record<string, number> = {};
  for (const t of txs || []) {
    const c = toDefault(t.amount, t.currency);
    totalSpent += c;
    spentByCategory[t.category_id] = (spentByCategory[t.category_id] || 0) + c;
  }

  const lines = budgets.map((b) => {
    const limit = toDefault(b.amount, b.currency);
    const spent = b.category_id ? (spentByCategory[b.category_id] || 0) : totalSpent;
    const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    const name = b.category_id ? (b.categories as unknown as { name: string })?.name || "Category" : "Overall";
    const bar = pct >= 100 ? "OVER" : `${pct}%`;
    return `- <b>${name}</b>: ${formatCurrency(spent, defaultCurrency)} / ${formatCurrency(limit, defaultCurrency)} (${bar})`;
  });

  await sendMessage(chatId, `<b>Budget Status</b>\n\n${lines.join("\n")}`);
}

async function handleCreateSavingsGoal(supabase: SupabaseClient, chatId: string, profile: Profile, parsed: ParsedQuery) {
  const goal = parsed.savings_goal;
  if (!goal) { await sendMessage(chatId, "Try: <i>Create savings goal Emergency Fund 5000 USD</i>"); return; }

  const { error } = await supabase.from("savings_goals").insert({
    user_id: profile.id, name: goal.name, target_amount: goal.target_amount, target_currency: goal.currency,
  });

  if (error) { await sendMessage(chatId, `Error: ${error.message}`); return; }

  await sendMessage(chatId,
    `<b>Savings goal created!</b>\n${goal.name}\nTarget: ${formatCurrency(goal.target_amount, goal.currency as Currency)}`
  );
}

async function handleContributeSavings(supabase: SupabaseClient, chatId: string, profile: Profile, parsed: ParsedQuery) {
  const contrib = parsed.contribution;
  if (!contrib) { await sendMessage(chatId, "Try: <i>Add 200 to Emergency Fund</i>"); return; }

  const { data: allGoals } = await supabase.from("savings_goals").select("id, name, current_amount, target_amount, target_currency")
    .eq("user_id", profile.id).eq("status", "active");

  const goalMatch = fuzzyMatch(allGoals || [], contrib.goal_name);
  if (!goalMatch) { await sendMessage(chatId, `No active goal matching "${contrib.goal_name}".`); return; }

  const goal = (allGoals || []).find((g) => g.id === goalMatch.id)!;
  const exchangeRate = profile.exchange_rate || 0.709;
  let converted = contrib.amount;
  if (contrib.currency !== goal.target_currency) {
    converted = convertCurrency(contrib.amount, contrib.currency as Currency, goal.target_currency as Currency, exchangeRate);
  }

  const newAmount = Math.round((goal.current_amount + converted) * 100) / 100;
  const newStatus = newAmount >= goal.target_amount ? "completed" : "active";

  await supabase.from("savings_contributions").insert({
    user_id: profile.id, goal_id: goal.id, amount: contrib.amount, currency: contrib.currency,
  });
  await supabase.from("savings_goals").update({ current_amount: newAmount, status: newStatus }).eq("id", goal.id);

  const pct = Math.round((newAmount / goal.target_amount) * 100);
  let msg = `<b>Contribution added!</b>\n+${formatCurrency(contrib.amount, contrib.currency as Currency)} to ${goal.name}\nProgress: ${formatCurrency(newAmount, goal.target_currency as Currency)} / ${formatCurrency(goal.target_amount, goal.target_currency as Currency)} (${pct}%)`;
  if (newStatus === "completed") msg += "\n\nGoal completed! Congratulations!";

  await sendMessage(chatId, msg);
}

async function handleCheckSavings(supabase: SupabaseClient, chatId: string, profile: Profile) {
  const { data: goals } = await supabase.from("savings_goals").select("name, current_amount, target_amount, target_currency, status")
    .eq("user_id", profile.id).order("created_at", { ascending: false });

  if (!goals || goals.length === 0) { await sendMessage(chatId, "No savings goals. Try: <i>Create savings goal Emergency Fund 5000</i>"); return; }

  const lines = goals.map((g) => {
    const pct = g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0;
    const status = g.status === "completed" ? " [DONE]" : "";
    return `- <b>${g.name}</b>${status}: ${formatCurrency(g.current_amount, g.target_currency as Currency)} / ${formatCurrency(g.target_amount, g.target_currency as Currency)} (${pct}%)`;
  });

  await sendMessage(chatId, `<b>Savings Goals</b>\n\n${lines.join("\n")}`);
}

async function handleCreateDebt(supabase: SupabaseClient, chatId: string, profile: Profile, parsed: ParsedQuery) {
  const debt = parsed.debt;
  if (!debt) { await sendMessage(chatId, "Try: <i>I owe Ahmed 50 JOD for dinner</i>"); return; }

  const { error } = await supabase.from("debts").insert({
    user_id: profile.id, direction: debt.direction, person_name: debt.person_name,
    amount: debt.amount, currency: debt.currency, reason: debt.reason || null,
    due_date: debt.due_date || null,
  });

  if (error) { await sendMessage(chatId, `Error: ${error.message}`); return; }

  const label = debt.direction === "i_owe" ? `You owe ${debt.person_name}` : `${debt.person_name} owes you`;
  await sendMessage(chatId,
    `<b>Debt recorded!</b>\n${label}\n${formatCurrency(debt.amount, debt.currency as Currency)}${debt.reason ? `\nReason: ${debt.reason}` : ""}`
  );
}

async function handleListDebts(supabase: SupabaseClient, chatId: string, profile: Profile, defaultCurrency: Currency, toDefault: (a: number, c: string) => number) {
  const { data: debts } = await supabase.from("debts").select("direction, person_name, amount, currency, reason, status")
    .eq("user_id", profile.id).eq("status", "active");

  if (!debts || debts.length === 0) { await sendMessage(chatId, "No active debts."); return; }

  let totalIOwe = 0, totalTheyOwe = 0;
  const lines = debts.map((d) => {
    const c = toDefault(d.amount, d.currency);
    if (d.direction === "i_owe") totalIOwe += c; else totalTheyOwe += c;
    const label = d.direction === "i_owe" ? `You owe ${d.person_name}` : `${d.person_name} owes you`;
    return `- ${label}: ${formatCurrency(d.amount, d.currency as Currency)}${d.reason ? ` (${d.reason})` : ""}`;
  });

  lines.push("");
  lines.push(`<b>You owe:</b> ${formatCurrency(totalIOwe, defaultCurrency)}`);
  lines.push(`<b>Owed to you:</b> ${formatCurrency(totalTheyOwe, defaultCurrency)}`);

  await sendMessage(chatId, `<b>Active Debts</b>\n\n${lines.join("\n")}`);
}

async function handlePayDebt(supabase: SupabaseClient, chatId: string, profile: Profile, parsed: ParsedQuery) {
  const personName = parsed.pay_debt?.person_name;
  if (!personName) { await sendMessage(chatId, "Who did you pay? Try: <i>I paid Ahmed</i>"); return; }

  const { data: allDebts } = await supabase.from("debts").select("id, direction, person_name, amount, currency")
    .eq("user_id", profile.id).eq("status", "active");

  const debtMatch = fuzzyMatch((allDebts || []).map((d) => ({ id: d.id, name: d.person_name })), personName);
  if (!debtMatch) { await sendMessage(chatId, `No active debt with "${personName}".`); return; }

  const debt = (allDebts || []).find((d) => d.id === debtMatch.id)!;
  const today = format(new Date(), "yyyy-MM-dd");

  // Create transaction
  const txType = debt.direction === "i_owe" ? "expense" : "income";
  const category = await findCategory(supabase, profile.id, "Other", txType);

  if (category) {
    const desc = debt.direction === "i_owe"
      ? `Paid debt to ${debt.person_name}`
      : `Received from ${debt.person_name}`;

    await supabase.from("transactions").insert({
      user_id: profile.id, type: txType, amount: debt.amount, currency: debt.currency,
      category_id: category.id, description: desc, date: today, created_via: "telegram",
    });
  }

  await supabase.from("debts").update({ status: "paid", paid_date: today }).eq("id", debt.id);

  await sendMessage(chatId,
    `<b>Debt settled!</b>\n${debt.person_name} - ${formatCurrency(debt.amount, debt.currency as Currency)}\nTransaction logged automatically.`
  );
}

// ============ EDIT HANDLERS ============

async function handleEditSubscription(supabase: SupabaseClient, chatId: string, profile: Profile, parsed: ParsedQuery) {
  const edit = parsed.edit_subscription;
  if (!edit?.name) { await sendMessage(chatId, "Which subscription? Try: <i>Edit Netflix billing date to May 1st</i>"); return; }

  const { data: allSubs } = await supabase.from("subscriptions").select("id, name").eq("user_id", profile.id).eq("status", "active");
  const match = fuzzyMatch(allSubs || [], edit.name);
  if (!match) { await sendMessage(chatId, `No active subscription matching "${edit.name}".`); return; }

  const updates: Record<string, string | number | null> = {};
  if (edit.new_name) updates.name = edit.new_name;
  if (edit.new_amount) updates.amount = edit.new_amount;
  if (edit.new_currency) updates.currency = edit.new_currency;
  if (edit.new_billing_cycle) updates.billing_cycle = edit.new_billing_cycle;
  if (edit.new_start_date) updates.next_billing_date = edit.new_start_date;

  if (Object.keys(updates).length === 0) { await sendMessage(chatId, "What do you want to change? Try: <i>Change Netflix billing date to May 1st</i>"); return; }

  await supabase.from("subscriptions").update(updates as never).eq("id", match.id);

  const changes = Object.entries(updates).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join("\n");
  await sendMessage(chatId, `<b>${match.name} updated!</b>\n${changes}`);
}

async function handleEditBudget(supabase: SupabaseClient, chatId: string, profile: Profile, parsed: ParsedQuery, toDefault: (a: number, c: string) => number) {
  const edit = parsed.edit_budget;
  if (!edit) { await sendMessage(chatId, "Try: <i>Change budget to 600 JOD</i>"); return; }

  let categoryId: string | null = null;
  if (edit.category_hint) {
    const cat = await findCategory(supabase, profile.id, edit.category_hint, "expense");
    if (cat) categoryId = cat.id;
  }

  let query = supabase.from("budgets").select("id").eq("user_id", profile.id);
  if (categoryId) { query = query.eq("category_id", categoryId); } else { query = query.is("category_id", null); }
  const { data: existing } = await query.maybeSingle();

  if (!existing) { await sendMessage(chatId, "No matching budget found. Set one first: <i>Set budget 500 JOD</i>"); return; }

  const updates: Record<string, unknown> = { amount: edit.new_amount };
  if (edit.new_currency) updates.currency = edit.new_currency;

  await supabase.from("budgets").update(updates as never).eq("id", existing.id);
  await sendMessage(chatId, `<b>Budget updated!</b>\nNew limit: ${formatCurrency(edit.new_amount, (edit.new_currency || profile.default_currency) as Currency)} / month`);
}

async function handleEditSavingsGoal(supabase: SupabaseClient, chatId: string, profile: Profile, parsed: ParsedQuery) {
  const edit = parsed.edit_savings_goal;
  if (!edit?.name) { await sendMessage(chatId, "Which goal? Try: <i>Edit Emergency Fund target to 8000</i>"); return; }

  const { data: allGoals } = await supabase.from("savings_goals").select("id, name").eq("user_id", profile.id).eq("status", "active");
  const match = fuzzyMatch(allGoals || [], edit.name);
  if (!match) { await sendMessage(chatId, `No active goal matching "${edit.name}".`); return; }

  const updates: Record<string, string | number | null> = {};
  if (edit.new_name) updates.name = edit.new_name;
  if (edit.new_target_amount) updates.target_amount = edit.new_target_amount;
  if (edit.new_deadline) updates.deadline = edit.new_deadline;

  if (Object.keys(updates).length === 0) { await sendMessage(chatId, "What do you want to change?"); return; }

  await supabase.from("savings_goals").update(updates as never).eq("id", match.id);

  const changes = Object.entries(updates).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join("\n");
  await sendMessage(chatId, `<b>${match.name} updated!</b>\n${changes}`);
}

async function handleEditDebt(supabase: SupabaseClient, chatId: string, profile: Profile, parsed: ParsedQuery) {
  const edit = parsed.edit_debt;
  if (!edit?.person_name) { await sendMessage(chatId, "Which debt? Try: <i>Edit Ahmed's debt to 100 JOD</i>"); return; }

  const { data: allDebts } = await supabase.from("debts").select("id, person_name").eq("user_id", profile.id).eq("status", "active");
  const match = fuzzyMatch((allDebts || []).map((d) => ({ id: d.id, name: d.person_name })), edit.person_name);
  if (!match) { await sendMessage(chatId, `No active debt with "${edit.person_name}".`); return; }

  const updates: Record<string, string | number | null> = {};
  if (edit.new_amount) updates.amount = edit.new_amount;
  if (edit.new_due_date) updates.due_date = edit.new_due_date;
  if (edit.new_reason) updates.reason = edit.new_reason;

  if (Object.keys(updates).length === 0) { await sendMessage(chatId, "What do you want to change?"); return; }

  await supabase.from("debts").update(updates as never).eq("id", match.id);

  const changes = Object.entries(updates).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join("\n");
  await sendMessage(chatId, `<b>Debt with ${match.name} updated!</b>\n${changes}`);
}

// GET handler: auto-registers webhook
export async function GET() {
  const appUrl = process.env.APP_URL;
  if (!appUrl) return NextResponse.json({ error: "APP_URL not set" }, { status: 500 });

  const webhookUrl = `${appUrl}/api/telegram/webhook`;
  const result = await setWebhook(webhookUrl);
  return NextResponse.json({ message: "Webhook registered", webhookUrl, result });
}
