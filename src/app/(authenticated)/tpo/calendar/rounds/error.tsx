"use client";
export default function ErrorView({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section role="alert" className="rounded-lg border border-border bg-surface p-5">
    <h1 className="text-lg font-semibold">Round scheduling could not load</h1>
    <p className="mt-2 text-sm">The schedule is unavailable, not empty.</p>
    <button onClick={reset} className="mt-3 min-h-10 rounded-md border border-border px-4">Retry</button>
  </section>;
}
