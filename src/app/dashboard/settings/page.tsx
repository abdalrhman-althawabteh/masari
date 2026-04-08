"use client";

import { useEffect, useState } from "react";
import { Sparkles, Eye, EyeOff, MessageCircle, Copy, Unlink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Topbar } from "@/components/layout/topbar";
import { toast } from "sonner";
import type { Profile } from "@/types/database";

const AI_PROVIDERS = [
  { value: "openai", label: "OpenAI", keyField: "openai_api_key" as const, placeholder: "sk-..." },
  { value: "anthropic", label: "Anthropic", keyField: "anthropic_api_key" as const, placeholder: "sk-ant-..." },
  { value: "gemini", label: "Google Gemini", keyField: "gemini_api_key" as const, placeholder: "AI..." },
];

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [exchangeRate, setExchangeRate] = useState("0.709");
  const [timezone, setTimezone] = useState("Asia/Amman");
  const [aiProvider, setAiProvider] = useState("openai");
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [telegramCode, setTelegramCode] = useState<string | null>(null);
  const [telegramLoading, setTelegramLoading] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data: Profile) => {
        setProfile(data);
        setName(data.name || "");
        setDefaultCurrency(data.default_currency);
        setExchangeRate(String(data.exchange_rate));
        setTimezone(data.timezone);
        setAiProvider(data.ai_provider || "openai");
        setOpenaiKey(data.openai_api_key || "");
        setAnthropicKey(data.anthropic_api_key || "");
        setGeminiKey(data.gemini_api_key || "");
        setTelegramLinked(!!data.telegram_chat_id);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const currentProvider = AI_PROVIDERS.find((p) => p.value === aiProvider) || AI_PROVIDERS[0];

  function getCurrentKey() {
    switch (aiProvider) {
      case "openai": return openaiKey;
      case "anthropic": return anthropicKey;
      case "gemini": return geminiKey;
      default: return "";
    }
  }

  function setCurrentKey(value: string) {
    switch (aiProvider) {
      case "openai": setOpenaiKey(value); break;
      case "anthropic": setAnthropicKey(value); break;
      case "gemini": setGeminiKey(value); break;
    }
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        default_currency: defaultCurrency,
        exchange_rate: parseFloat(exchangeRate),
        timezone,
        ai_provider: aiProvider,
        openai_api_key: openaiKey || null,
        anthropic_api_key: anthropicKey || null,
        gemini_api_key: geminiKey || null,
      }),
    });

    if (res.ok) {
      toast.success("Settings saved");
    } else {
      toast.error("Failed to save settings");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <>
        <Topbar title="Settings" />
        <div className="p-4 lg:p-6 space-y-4">
          <Skeleton className="h-60" />
          <Skeleton className="h-40" />
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Settings" />

      <div className="p-4 lg:p-6 space-y-6 max-w-2xl">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile?.email || ""} disabled />
              <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
            </div>
          </CardContent>
        </Card>

        {/* AI Assistant */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Assistant
            </CardTitle>
            <CardDescription>
              Configure your AI provider for auto-categorization and financial advice
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>AI Provider</Label>
              <Select value={aiProvider} onValueChange={(val) => { setAiProvider(val as string); setShowKey(false); }}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="api-key">{currentProvider.label} API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="api-key"
                  type={showKey ? "text" : "password"}
                  value={getCurrentKey()}
                  onChange={(e) => setCurrentKey(e.target.value)}
                  placeholder={currentProvider.placeholder}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Your API key is stored securely and used for AI features like auto-categorization and &quot;Can I Spend This?&quot;
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Telegram */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[#0088cc]" />
              Telegram Bot
            </CardTitle>
            <CardDescription>
              Link your Telegram account to log transactions via chat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {telegramLinked ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[var(--income)]" />
                  <span className="text-sm font-medium">Telegram linked</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Send messages to your bot to log expenses, income, or scan receipts.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    setTelegramLoading(true);
                    const res = await fetch("/api/telegram/unlink", { method: "POST" });
                    if (res.ok) {
                      setTelegramLinked(false);
                      setTelegramCode(null);
                    }
                    setTelegramLoading(false);
                  }}
                  disabled={telegramLoading}
                >
                  <Unlink className="h-3.5 w-3.5 mr-1" />
                  Unlink Telegram
                </Button>
              </div>
            ) : telegramCode ? (
              <div className="space-y-3">
                <p className="text-sm">Send this code to your Masari bot on Telegram:</p>
                <div className="flex items-center gap-2">
                  <code className="bg-accent px-4 py-2 rounded-lg text-2xl font-mono font-bold tracking-widest">
                    {telegramCode}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigator.clipboard.writeText(telegramCode)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Open <a href="https://t.me/masari_money_bot" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@masari_money_bot</a> on Telegram and send the code above.
                </p>
              </div>
            ) : (
              <Button
                onClick={async () => {
                  setTelegramLoading(true);
                  const res = await fetch("/api/telegram/link", { method: "POST" });
                  if (res.ok) {
                    const { code } = await res.json();
                    setTelegramCode(code);
                  }
                  setTelegramLoading(false);
                }}
                disabled={telegramLoading}
                size="sm"
              >
                {telegramLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Generating...</>
                ) : (
                  <><MessageCircle className="h-4 w-4 mr-1" /> Link Telegram</>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Currency */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Currency</CardTitle>
            <CardDescription>
              Set your default display currency and exchange rate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default Currency</Label>
              <Select value={defaultCurrency} onValueChange={(val) => setDefaultCurrency(val as string)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="JOD">JOD</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Dashboard totals will be shown in this currency.
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="exchange-rate">Exchange Rate (1 USD = ? JOD)</Label>
              <Input
                id="exchange-rate"
                type="number"
                step="0.0001"
                min="0.0001"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                className="w-40"
              />
              <p className="text-xs text-muted-foreground">
                Used to convert between USD and JOD for display purposes.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Timezone */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Timezone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="e.g. Asia/Amman"
              />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </>
  );
}
