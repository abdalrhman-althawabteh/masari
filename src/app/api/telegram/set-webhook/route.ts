import { NextResponse } from "next/server";
import { setWebhook } from "@/lib/telegram/bot";

export async function POST() {
  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    return NextResponse.json({ error: "APP_URL not configured" }, { status: 500 });
  }

  const webhookUrl = `${appUrl}/api/telegram/webhook`;
  const result = await setWebhook(webhookUrl);

  return NextResponse.json({ webhookUrl, result });
}
