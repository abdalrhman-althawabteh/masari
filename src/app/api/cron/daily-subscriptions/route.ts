import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { addMonths, addYears, addWeeks, format } from "date-fns";
import type { Database } from "@/types/database";

// Use service role client for cron jobs (bypasses RLS)
function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function advanceDate(date: string, cycle: string): string {
  const d = new Date(date + "T00:00:00");
  switch (cycle) {
    case "monthly":
      return format(addMonths(d, 1), "yyyy-MM-dd");
    case "yearly":
      return format(addYears(d, 1), "yyyy-MM-dd");
    case "weekly":
      return format(addWeeks(d, 1), "yyyy-MM-dd");
    default:
      return format(addMonths(d, 1), "yyyy-MM-dd");
  }
}

export async function POST(request: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = format(new Date(), "yyyy-MM-dd");

  // Find all active subscriptions due today or overdue
  const { data: dueSubs, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("status", "active")
    .lte("next_billing_date", today);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = {
    processed: 0,
    transactions_created: 0,
    errors: [] as string[],
  };

  for (const sub of dueSubs || []) {
    try {
      // Create expense transaction for this subscription
      const { error: txError } = await supabase
        .from("transactions")
        .insert({
          user_id: sub.user_id,
          type: "expense",
          amount: sub.amount,
          currency: sub.currency,
          category_id: sub.category_id,
          description: `${sub.name} (auto-logged subscription)`,
          date: sub.next_billing_date,
          is_subscription: true,
          subscription_id: sub.id,
          created_via: "app",
        });

      if (txError) {
        results.errors.push(`Transaction for ${sub.name}: ${txError.message}`);
        continue;
      }

      results.transactions_created++;

      // Advance the next billing date
      const nextDate = advanceDate(sub.next_billing_date, sub.billing_cycle);
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({ next_billing_date: nextDate })
        .eq("id", sub.id);

      if (updateError) {
        results.errors.push(`Update ${sub.name}: ${updateError.message}`);
      }

      results.processed++;
    } catch (err) {
      results.errors.push(`${sub.name}: ${String(err)}`);
    }
  }

  return NextResponse.json({
    success: true,
    date: today,
    ...results,
  });
}
