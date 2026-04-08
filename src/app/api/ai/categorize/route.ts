import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { categorizeTransaction } from "@/lib/ai/categorize";
import { getApiKey, type AIProvider } from "@/lib/ai/provider";
import { z } from "zod";

const schema = z.object({
  description: z.string().min(1).max(500),
  type: z.enum(["income", "expense"]),
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

  const { description, type } = parsed.data;

  // Get user profile for AI config
  const { data: profile } = await supabase
    .from("profiles")
    .select("ai_provider, openai_api_key, anthropic_api_key, gemini_api_key")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const provider = (profile.ai_provider || "openai") as AIProvider;
  const apiKey = getApiKey(provider, profile);

  if (!apiKey) {
    return NextResponse.json(
      { error: "No API key configured. Add one in Settings → AI Assistant." },
      { status: 400 }
    );
  }

  // Check for stored override first (exact keyword match)
  const keyword = description.toLowerCase().trim();
  const { data: override } = await supabase
    .from("ai_category_overrides")
    .select("category_id, categories!inner(name, icon)")
    .eq("user_id", user.id)
    .eq("keyword", keyword)
    .maybeSingle();

  if (override) {
    const cat = override.categories as unknown as { name: string; icon: string };
    return NextResponse.json({
      category_id: override.category_id,
      category_name: cat.name,
      confidence: "high",
      source: "learned",
    });
  }

  // Get user's categories filtered by type
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, icon")
    .eq("user_id", user.id)
    .or(`type.eq.${type},type.eq.both`);

  if (!categories?.length) {
    return NextResponse.json({ error: "No categories found" }, { status: 404 });
  }

  try {
    const result = await categorizeTransaction(
      provider,
      apiKey,
      description,
      type,
      categories
    );

    if (result) {
      return NextResponse.json({ ...result, source: "ai" });
    }

    return NextResponse.json({ error: "Could not categorize" }, { status: 422 });
  } catch (err) {
    return NextResponse.json(
      { error: `AI error: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
