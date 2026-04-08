import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  amount: z.number().positive(),
  currency: z.enum(["USD", "JOD"]),
  notes: z.string().max(500).optional().nullable(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Get the goal to verify ownership and get currency
  const { data: goal } = await supabase
    .from("savings_goals")
    .select("target_currency, current_amount, target_amount")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  // Get user profile for exchange rate
  const { data: profile } = await supabase
    .from("profiles")
    .select("exchange_rate")
    .eq("id", user.id)
    .single();

  const exchangeRate = profile?.exchange_rate || 0.709;

  // Convert contribution to goal's currency
  let convertedAmount = parsed.data.amount;
  if (parsed.data.currency !== goal.target_currency) {
    if (goal.target_currency === "JOD") convertedAmount = parsed.data.amount * exchangeRate;
    else convertedAmount = parsed.data.amount / exchangeRate;
  }

  // Insert contribution
  const { error: contribError } = await supabase
    .from("savings_contributions")
    .insert({
      user_id: user.id,
      goal_id: id,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      notes: parsed.data.notes || null,
    });

  if (contribError) return NextResponse.json({ error: contribError.message }, { status: 500 });

  // Update goal's current_amount
  const newAmount = Math.round((goal.current_amount + convertedAmount) * 100) / 100;
  const newStatus = newAmount >= goal.target_amount ? "completed" : "active";

  const { data: updated, error: updateError } = await supabase
    .from("savings_goals")
    .update({ current_amount: newAmount, status: newStatus })
    .eq("id", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json(updated);
}
