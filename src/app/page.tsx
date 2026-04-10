import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LandingContent from "@/components/landing/landing-content";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return <LandingContent />;
}
