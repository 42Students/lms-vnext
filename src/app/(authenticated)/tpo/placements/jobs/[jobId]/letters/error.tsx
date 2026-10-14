"use client";
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section role="alert" className="rounded-xl border border-border p-6">
    Offer evidence cannot be loaded. It is not assumed to be empty.
    <button type="button" className="ml-3 rounded border px-4 py-2" onClick={reset}>Retry</button>
  </section>;
}
