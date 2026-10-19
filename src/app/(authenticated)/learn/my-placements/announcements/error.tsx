"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <main role="alert" className="py-5">
    <h1 className="font-semibold text-[var(--lms-heading)] text-[30px] leading-9">Announcements unavailable</h1>
    <p className="mt-2 text-sm text-body">Your notices could not be loaded. No missing announcements were inferred.</p>
    <button type="button" onClick={reset} className="mt-4 min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9">Retry</button>
  </main>;
}
