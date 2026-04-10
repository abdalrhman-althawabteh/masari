import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ transactions: [], subscriptions: [], debts: [], savings: [] });
  }

  const pattern = `%${q}%`;

  const [txRes, subRes, debtRes, savingsRes] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, type, amount, currency, description, date, categories!inner(name, icon)")
      .eq("user_id", user.id)
      .ilike("description", pattern)
      .order("date", { ascending: false })
      .limit(5),
    supabase
      .from("subscriptions")
      .select("id, name, amount, currency, status, categories!inner(name, icon)")
      .eq("user_id", user.id)
      .ilike("name", pattern)
      .limit(5),
    supabase
      .from("debts")
      .select("id, direction, person_name, amount, currency, status")
      .eq("user_id", user.id)
      .ilike("person_name", pattern)
      .limit(5),
    supabase
      .from("savings_goals")
      .select("id, name, target_amount, current_amount, target_currency, status")
      .eq("user_id", user.id)
      .ilike("name", pattern)
      .limit(5),
  ]);

  return NextResponse.json({
    transactions: txRes.data || [],
    subscriptions: subRes.data || [],
    debts: debtRes.data || [],
    savings: savingsRes.data || [],
  });
}
