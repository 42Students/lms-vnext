"use client";

/**
 * GR-19: accessible skeleton with a bounded "taking longer" fallback.
 * Usage: export default function Loading() { return <GracefulPageLoading />; }
 */
import { useEffect, useState } from "react";

export function GracefulPageLoading() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 12_000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section role="status" aria-live="polite" className="w-full min-w-0 space-y-4 rounded-lg border border-border bg-surface p-6">
      <p className="text-sm text-muted-foreground">Loading your page...</p>
      <div aria-hidden="true" className={`h-5 w-2/5 rounded bg-border ${slow ? "" : "animate-pulse"}`} />
      <div aria-hidden="true" className={`h-24 w-full rounded bg-border ${slow ? "" : "animate-pulse"}`} />
      {slow && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-foreground">This is taking longer than expected. Please try again.</p>
          <button type="button" onClick={() => window.location.reload()}
            className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-primary-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lms-focus-ring)]">
            Try again
          </button>
        </div>
      )}
    </section>
  );
}
