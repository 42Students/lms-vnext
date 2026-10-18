"use client";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div role="alert" className="rounded-lg border border-border bg-surface p-6">
    <h1 className="font-semibold">Contact people could not be loaded</h1>
    <p className="mt-2 text-sm text-body">The contact list is unavailable; this is not an empty list.</p>
    <button type="button" className="mt-4 rounded-[9px] border px-4 py-2" onClick={reset}>Retry</button>
  </div>;
}
