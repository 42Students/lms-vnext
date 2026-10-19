"use client";

export default function FacultyProfileError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface px-6 py-10 text-center">
      <h1 className="font-semibold text-[30px] text-[var(--lms-heading)]">
        Unable to load your profile
      </h1>
      <p className="mt-2 text-sm text-body">
        Your Faculty profile could not be loaded. Try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 min-h-11 rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary"
      >
        Retry
      </button>
    </section>
  );
}
