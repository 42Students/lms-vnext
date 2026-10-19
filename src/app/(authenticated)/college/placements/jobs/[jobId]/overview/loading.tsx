export default function Loading() {
  return <div aria-label="Loading drive overview" aria-busy="true" className="space-y-4">
    <div className="h-20 animate-pulse rounded-[var(--lms-control-radius,9px)] bg-[var(--lms-neutral-100)]" /><div className="h-44 animate-pulse rounded-[var(--lms-control-radius,9px)] bg-[var(--lms-neutral-100)]" />
  </div>;
}
