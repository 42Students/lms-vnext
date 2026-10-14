export default function Loading() {
  return <div role="status" className="space-y-4 p-5">
    <div className="h-8 w-56 animate-pulse rounded bg-muted" />
    <div className="h-56 animate-pulse rounded-xl border border-border bg-surface-secondary" />
    <span className="sr-only">Loading recruiter drive draft</span>
  </div>;
}
