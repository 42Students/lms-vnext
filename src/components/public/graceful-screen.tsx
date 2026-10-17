"use client";

/**
 * GR-11/13/14: shared, code-free failure screen.
 * Usage: <GracefulScreen title="Page unavailable" message="Please try again."
 *   homeHref="/dashboard" requestId={requestId} retry={reset} />
 */
import Link from "next/link";
import { friendlyReference } from "@/lib/friendly-error";

export function GracefulScreen({ title, message, homeHref = "/", retry, requestId, homeLabel = "Go to home" }: {
  title: string;
  message: string;
  homeHref?: string;
  retry?: () => void;
  requestId?: string | null;
  homeLabel?: string;
}) {
  const reference = friendlyReference(requestId);
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--lms-neutral-50)] px-5 py-12">
      <section className="w-full max-w-lg rounded-xl border border-border bg-surface p-7 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{message}</p>
        {reference && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-body">
            <span>{reference}</span>
            <button type="button"
              onClick={() => { if (requestId) void navigator.clipboard?.writeText(requestId).catch(() => {}); }}
              className="rounded-md border border-border px-2 py-1 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lms-focus-ring)]">
              Copy reference
            </button>
          </div>
        )}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {retry && <button type="button" onClick={retry}
            className="min-h-11 rounded-md border border-primary bg-primary px-5 py-2 text-sm font-semibold text-on-primary focus-visible:ring-2 focus-visible:ring-[var(--lms-focus-ring)]">
            Try again
          </button>}
          <Link href={homeHref}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-5 py-2 text-sm font-semibold text-primary-text hover:bg-primary-subtle focus-visible:ring-2 focus-visible:ring-[var(--lms-focus-ring)]">
            {homeLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}
