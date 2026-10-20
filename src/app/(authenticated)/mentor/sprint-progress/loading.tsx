export default function Loading() {
  return <div aria-busy="true" aria-label="Loading Mentor sprint progress" className="space-y-4">
    <div className="h-9 w-60 max-w-full animate-pulse rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-100)]" />
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">{[0,1,2].map(i => <div key={i} className="h-11 animate-pulse rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-100)]" />)}</div>
    <div className="h-48 animate-pulse rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-100)]" />
  </div>;
}
