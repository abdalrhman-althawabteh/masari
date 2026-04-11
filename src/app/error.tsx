"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-7xl font-bold text-[#FF4444] mb-4">Oops</h1>
        <h2 className="text-2xl font-semibold text-white mb-2">
          Something went wrong
        </h2>
        <p className="text-[#888] mb-8">
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center px-5 py-2.5 bg-[#A3FF3C] text-black font-medium rounded-lg hover:bg-[#8ee633] transition-colors"
          >
            Try Again
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center px-5 py-2.5 bg-[#1a1a1a] text-white font-medium rounded-lg border border-[#2a2a2a] hover:bg-[#222] transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
