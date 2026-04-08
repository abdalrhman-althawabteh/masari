import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMessage, getFileUrl, downloadFileAsBase64, setWebhook, type TelegramUpdate } from "@/lib/telegram/bot";
import { parseMessage, parseReceipt } from "@/lib/telegram/parse";
import { getApiKey, type AIProvider } from "@/lib/ai/provider";
import { formatCurrency, type Currency } from "@/lib/currency";
import { startOfMonth, endOfMonth, format, addDays } from "date-fns";
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

  if (!message) {
    return NextResponse.json({ ok: true });
  }

  const chatId = String(message.chat.id);
  const supabase = createAdminClient();

  // Find user by telegram_chat_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("telegram_chat_id", chatId)
    .maybeSingle();

  // Check if this is a link code
  if (message.text && !profile) {
    const code = message.text.trim();
    // Check if this is a 6-digit link code
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
          `✅ <b>Linked!</b> Welcome ${linkProfile.name || ""}!\n\nYou can now log transactions by sending messages like:\n• <i>Spent 15 JOD on lunch</i>\n• <i>Got 500 USD from client</i>\n• <i>Send a receipt photo</i>\n\nOr ask:\n• <i>What's my balance?</i>\n• <i>How much did I spend today?</i>`
        );
        return NextResponse.json({ ok: true });
      }
    }

    await sendMessage(chatId,
      "👋 Welcome to <b>Masari</b>!\n\nTo get started, link your account:\n1. Go to Settings in the app\n2. Click \"Link Telegram\"\n3. Send me the 6-digit code"
    );
    return NextResponse.json({ ok: true });
  }

  if (!profile) {
    await sendMessage(chatId, "Please link your account first. Go to Settings → Telegram in the Masari app.");
    return NextResponse.json({ ok: true });
  }

  const provider = (profile.ai_provider || "openai") as AIProvider;
  const apiKey = getApiKey(provider, profile);
  const defaultCurrency = (profile.default_currency || "USD") as Currency;
  const exchangeRate = profile.exchange_rate || 0.709;

  function toDefault(amount: number, currency: string): number {
    if (currency === defaultCurrency) return amount;
    if (defaultCurrency === "JOD") return amount * exchangeRate;
    return amount / exchangeRate;
  }

  // Handle photo (receipt scanning)
  if (message.photo && message.photo.length > 0) {
    if (!apiKey) {
      await sendMessage(chatId, "⚠️ No AI API key configured. Add one in Settings → AI Assistant.");
      return NextResponse.json({ ok: true });
    }

    await sendMessage(chatId, "📸 Scanning receipt...");

    const largestPhoto = message.photo[message.photo.length - 1];
    const fileUrl = await getFileUrl(largestPhoto.file_id);

    if (!fileUrl) {
      await sendMessage(chatId, "❌ Couldn't download the image. Please try again.");
      return NextResponse.json({ ok: true });
    }

    try {
      const base64 = await downloadFileAsBase64(fileUrl);
      const receipt = await parseReceipt(provider, apiKey, base64, defaultCurrency);

      if (!receipt || !receipt.total) {
        await sendMessage(chatId, "❌ Couldn't read the receipt. Try a clearer photo.");
        return NextResponse.json({ ok: true });
      }

      // Find matching category
      const { data: categories } = await supabase
        .from("categories")
        .select("id, name")
        .eq("user_id", profile.id)
        .or("type.eq.expense,type.eq.both");

      const category = categories?.find(
        (c) => c.name.toLowerCase().includes((receipt.category_hint || "").toLowerCase())
      ) || categories?.[categories.length - 1]; // fallback to last (Other)

      if (!category) {
        await sendMessage(chatId, "❌ No categories found.");
        return NextResponse.json({ ok: true });
      }

      const { error } = await supabase.from("transactions").insert({
        user_id: profile.id,
        type: "expense",
        amount: receipt.total,
        currency: receipt.currency || defaultCurrency,
        category_id: category.id,
        description: `${receipt.store_name || "Receipt"} (scanned)`,
        date: receipt.date || format(new Date(), "yyyy-MM-dd"),
        created_via: "telegram",
      });

      if (error) {
        await sendMessage(chatId, `❌ Error saving: ${error.message}`);
      } else {
        await sendMessage(chatId,
          `✅ <b>Receipt logged!</b>\n📍 ${receipt.store_name || "Store"}\n💰 ${formatCurrency(receipt.total, (receipt.currency || defaultCurrency) as Currency)}\n📁 ${category.name}\n📅 ${receipt.date || "Today"}`
        );
      }
    } catch (err) {
      await sendMessage(chatId, `❌ Error scanning receipt: ${err instanceof Error ? err.message : "Unknown"}`);
    }

    return NextResponse.json({ ok: true });
  }

  // Handle text message
  if (!message.text) {
    return NextResponse.json({ ok: true });
  }

  const text = message.text.trim();

  // Handle /start command
  if (text === "/start") {
    await sendMessage(chatId,
      `👋 Hey ${profile.name || ""}! I'm your <b>Masari</b> assistant.\n\nYou can:\n• <i>Spent 15 JOD on lunch</i> — log expense\n• <i>Got 500 USD from Ahmed</i> — log income\n• <i>Send a receipt photo</i> — scan & log\n• <i>What's my balance?</i>\n• <i>How much did I spend today?</i>\n• <i>Upcoming subscriptions?</i>`
    );
    return NextResponse.json({ ok: true });
  }

  if (!apiKey) {
    await sendMessage(chatId, "⚠️ No AI API key configured. Add one in Settings → AI Assistant.");
    return NextResponse.json({ ok: true });
  }

  try {
    const parsed = await parseMessage(provider, apiKey, text, defaultCurrency);

    switch (parsed.intent) {
      case "log_transaction": {
        const tx = parsed.transaction;
        if (!tx) {
          await sendMessage(chatId, "🤔 Couldn't understand the transaction. Try: <i>Spent 15 JOD on lunch</i>");
          break;
        }

        // Find matching category
        const { data: categories } = await supabase
          .from("categories")
          .select("id, name")
          .eq("user_id", profile.id)
          .or(`type.eq.${tx.type},type.eq.both`);

        const category = categories?.find(
          (c) => c.name.toLowerCase().includes((tx.category_hint || "").toLowerCase())
        ) || categories?.[categories!.length - 1];

        if (!category) {
          await sendMessage(chatId, "❌ No categories found.");
          break;
        }

        const { error } = await supabase.from("transactions").insert({
          user_id: profile.id,
          type: tx.type,
          amount: tx.amount,
          currency: tx.currency,
          category_id: category.id,
          description: tx.description,
          source: tx.source || null,
          date: format(new Date(), "yyyy-MM-dd"),
          created_via: "telegram",
        });

        if (error) {
          await sendMessage(chatId, `❌ Error: ${error.message}`);
        } else {
          const emoji = tx.type === "income" ? "💰" : "💸";
          const sign = tx.type === "income" ? "+" : "-";
          await sendMessage(chatId,
            `✅ <b>${tx.type === "income" ? "Income" : "Expense"} logged!</b>\n${emoji} ${sign}${formatCurrency(tx.amount, tx.currency as Currency)}\n📝 ${tx.description}\n📁 ${category.name}`
          );
        }
        break;
      }

      case "check_balance": {
        const now = new Date();
        const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
        const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

        const { data: txs } = await supabase
          .from("transactions")
          .select("type, amount, currency")
          .eq("user_id", profile.id)
          .gte("date", monthStart)
          .lte("date", monthEnd);

        let income = 0, expenses = 0;
        for (const t of txs || []) {
          const c = toDefault(t.amount, t.currency);
          if (t.type === "income") income += c;
          else expenses += c;
        }

        await sendMessage(chatId,
          `📊 <b>This month (${format(now, "MMMM yyyy")})</b>\n\n💰 Income: ${formatCurrency(income, defaultCurrency)}\n💸 Expenses: ${formatCurrency(expenses, defaultCurrency)}\n${income - expenses >= 0 ? "✅" : "⚠️"} Balance: ${formatCurrency(income - expenses, defaultCurrency)}`
        );
        break;
      }

      case "today_spending": {
        const today = format(new Date(), "yyyy-MM-dd");
        const { data: txs } = await supabase
          .from("transactions")
          .select("type, amount, currency, description")
          .eq("user_id", profile.id)
          .eq("date", today)
          .eq("type", "expense");

        if (!txs || txs.length === 0) {
          await sendMessage(chatId, "✨ No spending today! Great job.");
          break;
        }

        let total = 0;
        const lines = txs.map((t) => {
          const c = toDefault(t.amount, t.currency);
          total += c;
          return `• ${t.description}: ${formatCurrency(t.amount, t.currency as Currency)}`;
        });

        await sendMessage(chatId,
          `💸 <b>Today's spending</b>\n\n${lines.join("\n")}\n\n<b>Total: ${formatCurrency(total, defaultCurrency)}</b>`
        );
        break;
      }

      case "upcoming_subs": {
        const today = format(new Date(), "yyyy-MM-dd");
        const weekLater = format(addDays(new Date(), 7), "yyyy-MM-dd");

        const { data: subs } = await supabase
          .from("subscriptions")
          .select("name, amount, currency, next_billing_date")
          .eq("user_id", profile.id)
          .eq("status", "active")
          .gte("next_billing_date", today)
          .lte("next_billing_date", weekLater)
          .order("next_billing_date");

        if (!subs || subs.length === 0) {
          await sendMessage(chatId, "✅ No subscriptions renewing in the next 7 days.");
          break;
        }

        const lines = subs.map(
          (s) => `• ${s.name}: ${formatCurrency(s.amount, s.currency as Currency)} on ${s.next_billing_date}`
        );

        await sendMessage(chatId,
          `📅 <b>Upcoming renewals (7 days)</b>\n\n${lines.join("\n")}`
        );
        break;
      }

      default:
        await sendMessage(chatId,
          "🤔 Not sure what you mean. Try:\n• <i>Spent 15 JOD on lunch</i>\n• <i>What's my balance?</i>\n• <i>How much did I spend today?</i>\n• Send a receipt photo"
        );
    }
  } catch (err) {
    await sendMessage(chatId, `❌ Error: ${err instanceof Error ? err.message : "Something went wrong"}`);
  }

  return NextResponse.json({ ok: true });
}

// GET handler: auto-registers the webhook with Telegram
export async function GET() {
  const appUrl = process.env.APP_URL;
  if (!appUrl) {
    return NextResponse.json({ error: "APP_URL not set" }, { status: 500 });
  }

  const webhookUrl = `${appUrl}/api/telegram/webhook`;
  const result = await setWebhook(webhookUrl);
  return NextResponse.json({
    message: "Webhook registered",
    webhookUrl,
    result,
  });
}
