export default function Loading() {
  return <div role="status" className="space-y-4">
    <div className="h-8 w-56 animate-pulse rounded-[var(--lms-control-radius)] bg-muted" />
    <div className="h-56 animate-pulse rounded-[var(--lms-radius-card)] border border-border bg-surface-secondary" />
    <span className="sr-only">Loading recruiter drive draft</span>
  </div>;
}
