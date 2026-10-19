"use client";

export default function Error({reset}: {
  error: Error & {digest?: string};
  reset: () => void;
}) {
  return <section role="alert" className="border-b border-border pb-4">
    <h1 className="font-semibold text-foreground text-[30px] font-semibold leading-[1.35] tracking-[-0.02em] text-[var(--lms-heading)]">Unable to load delivery review history</h1>
    <p className="mt-2 text-sm text-body">
      The read failed; a missing display is not evidence that there are no records.
    </p>
    <button type="button" onClick={reset}
      className="mt-4 rounded-[var(--lms-control-radius)] border border-border px-4 py-2 text-sm font-semibold text-link">
      Retry
    </button>
  </section>;
}
