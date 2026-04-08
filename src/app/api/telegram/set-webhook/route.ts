import { NextResponse } from "next/server";
import { setWebhook } from "@/lib/telegram/bot";

async function registerWebhook() {
  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    return NextResponse.json({ error: "APP_URL not configured" }, { status: 500 });
  }

  const webhookUrl = `${appUrl}/api/telegram/webhook`;
  const result = await setWebhook(webhookUrl);

  return NextResponse.json({ webhookUrl, result });
}

// GET so you can just visit the URL in a browser
export async function GET() {
  return registerWebhook();
}

// POST for programmatic use
export async function POST() {
  return registerWebhook();
}
