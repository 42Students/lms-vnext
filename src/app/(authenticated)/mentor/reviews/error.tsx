"use client";
export default function Error({ reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  return <section role="alert" className="rounded-xl border border-border bg-surface p-6">
    <h1 className="font-semibold text-foreground">Unable to load delivery reviews</h1>
    <p className="mt-2 text-sm text-body">This failure is not evidence that your assigned projects have no records.</p>
    <button type="button" onClick={reset} className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary-text">Retry</button>
  </section>;
}
