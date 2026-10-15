"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <main role="alert" className="rounded-xl border border-border bg-surface p-5">
    <h1 className="font-semibold text-foreground">Announcements unavailable</h1>
    <p className="mt-2 text-sm text-body">Your notices could not be loaded. No missing announcements were inferred.</p>
    <button type="button" onClick={reset} className="mt-4 min-h-11 rounded-md border border-border px-4 text-sm font-semibold">Retry</button>
  </main>;
}
