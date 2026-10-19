"use client";

export default function Error({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <section role="alert" className="min-w-0 border-b border-border bg-transparent py-[var(--lms-space-5)]">
    <PageHeader title={"Unable to load Faculty Section assessment health"} />
    <p className="mt-2 text-sm text-body">
      The read failed. This does not prove that the records are empty.
    </p>
    <Button type="button" variant="secondary" type="button" onClick={reset}
      className="mt-4 rounded-[var(--lms-control-radius)] border border-border px-4 py-2 text-sm font-semibold text-primary-text">
      Retry
    </Button>
  </section>;
}
