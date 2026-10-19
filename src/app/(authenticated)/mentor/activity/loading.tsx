export default function Loading() {
  return <div aria-busy="true" aria-label="Loading project activity" className="space-y-5">
    <div className="h-9 w-60 max-w-full animate-pulse rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-100)]" />
    <div className="h-20 animate-pulse rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-100)]" />
    <div className="h-72 animate-pulse rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-100)]" />
  </div>;
}
