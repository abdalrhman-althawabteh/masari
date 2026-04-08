import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { categorySchema } from "@/lib/validations/category";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .order("type")
    .order("sort_order");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = categorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Get max sort_order for this type
  const { data: maxSort } = await supabase
    .from("categories")
    .select("sort_order")
    .eq("user_id", user.id)
    .eq("type", parsed.data.type)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      icon: parsed.data.icon || null,
      type: parsed.data.type,
      sort_order: (maxSort?.sort_order ?? 0) + 1,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
