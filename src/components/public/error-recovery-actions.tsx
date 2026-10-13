"use client";

import Link from "next/link";

export function ErrorRecoveryActions({
  retry,
}: {
  retry?: () => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {retry ? (
        <button
          type="button"
          onClick={retry}
          className="min-h-11 rounded-full border border-primary bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
        >
          Try again
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => window.history.back()}
        className="min-h-11 rounded-full border border-primary bg-surface px-6 py-3 text-sm font-semibold text-primary-text transition hover:bg-primary-subtle focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
      >
        Go back
      </button>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
      >
        Go to Home
      </Link>
    </div>
  );
}
