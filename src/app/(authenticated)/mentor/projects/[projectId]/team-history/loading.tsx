export default function Loading() {
  return <div aria-busy="true" aria-label="Loading Mentor team history" className="space-y-4">
    <div className="h-9 w-60 max-w-full animate-pulse rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-100)]" />
    <div className="h-24 animate-pulse rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-100)]" />
    <div className="h-56 animate-pulse rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-100)]" />
  </div>;
}
