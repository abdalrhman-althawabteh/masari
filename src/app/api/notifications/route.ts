import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { format, addDays } from "date-fns";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = format(new Date(), "yyyy-MM-dd");
  const threeDaysLater = format(addDays(new Date(), 3), "yyyy-MM-dd");

  // Count overdue debts
  const { count: overdueDebts } = await supabase
    .from("debts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "active")
    .lt("due_date", today);

  // Count subscriptions renewing within 3 days
  const { count: upcomingSubs } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "active")
    .gte("next_billing_date", today)
    .lte("next_billing_date", threeDaysLater);

  return NextResponse.json({
    overdueDebts: overdueDebts || 0,
    upcomingSubs: upcomingSubs || 0,
  });
}
