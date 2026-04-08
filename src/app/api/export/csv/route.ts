import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, categories!inner(name)")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  if (!transactions || transactions.length === 0) {
    return new NextResponse("No transactions to export", { status: 404 });
  }

  const header = "Date,Type,Amount,Currency,Category,Description,Source,Created Via\n";
  const rows = transactions
    .map((t) => {
      const cat = (t.categories as unknown as { name: string })?.name || "";
      const desc = `"${(t.description || "").replace(/"/g, '""')}"`;
      const source = `"${(t.source || "").replace(/"/g, '""')}"`;
      return `${t.date},${t.type},${t.amount},${t.currency},"${cat}",${desc},${source},${t.created_via}`;
    })
    .join("\n");

  const csv = header + rows;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="masari-transactions-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
