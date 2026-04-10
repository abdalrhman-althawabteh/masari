export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[#0a0a0a]">
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(163,255,60,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(163,255,60,0.3) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#A3FF3C]/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-[#A3FF3C]/3 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#A3FF3C]/[0.02] rounded-full blur-[80px]" />
        {/* Radial fade */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#0a0a0a_70%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
