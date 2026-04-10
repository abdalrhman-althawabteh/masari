import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get the debt
  const { data: debt } = await supabase
    .from("debts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!debt) return NextResponse.json({ error: "Debt not found" }, { status: 404 });
  if (debt.status === "paid") return NextResponse.json({ error: "Already paid" }, { status: 400 });

  // Find a suitable category (look for "Other" expense or income category)
  const txType = debt.direction === "i_owe" ? "expense" : "income";
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("user_id", user.id)
    .or(`type.eq.${txType},type.eq.both`);

  // Try to find "Gifts & Donations" or "Other" category, fallback to last
  const category = categories?.find(c => c.name.toLowerCase().includes("gift") || c.name.toLowerCase().includes("donation"))
    || categories?.find(c => c.name.toLowerCase().includes("other"))
    || categories?.[categories.length - 1];

  if (!category) return NextResponse.json({ error: "No category found" }, { status: 500 });

  const today = format(new Date(), "yyyy-MM-dd");

  // Create transaction
  const description = debt.direction === "i_owe"
    ? `Paid debt to ${debt.person_name}${debt.reason ? ` (${debt.reason})` : ""}`
    : `Received debt payment from ${debt.person_name}${debt.reason ? ` (${debt.reason})` : ""}`;

  const { error: txError } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type: txType,
      amount: debt.amount,
      currency: debt.currency,
      category_id: category.id,
      description,
      date: today,
      created_via: "app",
    });

  if (txError) return NextResponse.json({ error: txError.message }, { status: 500 });

  // Mark debt as paid
  const { data: updated, error: updateError } = await supabase
    .from("debts")
    .update({ status: "paid", paid_date: today })
    .eq("id", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json(updated);
}
