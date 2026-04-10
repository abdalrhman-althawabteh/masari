import dynamic from "next/dynamic";
import { Sidebar } from "@/components/layout/sidebar";
import { FloatingAdd } from "@/components/layout/floating-add";

const CommandSearch = dynamic(
  () => import("@/components/layout/command-search").then((m) => m.CommandSearch),
  { ssr: false }
);

export const forceDynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-screen">{children}</main>
      <FloatingAdd />
      <CommandSearch />
    </div>
  );
}
