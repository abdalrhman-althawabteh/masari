import { Sidebar } from "@/components/layout/sidebar";
import { FloatingAdd } from "@/components/layout/floating-add";
import { CommandSearch } from "@/components/layout/command-search";

export const dynamic = "force-dynamic";

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
