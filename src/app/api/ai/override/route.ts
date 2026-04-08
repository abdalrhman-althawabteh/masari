import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  keyword: z.string().min(1).max(500),
  category_id: z.string().uuid(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const keyword = parsed.data.keyword.toLowerCase().trim();

  // Upsert: insert or update on conflict
  const { error } = await supabase
    .from("ai_category_overrides")
    .upsert(
      {
        user_id: user.id,
        keyword,
        category_id: parsed.data.category_id,
      },
      { onConflict: "user_id,keyword" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
