export default function CollegeDashboardLoading() {
  return <div className="space-y-4" aria-busy="true" aria-label="Loading College Admin dashboard">
    <div className="h-20 animate-pulse rounded-[var(--lms-control-radius,9px)] bg-[var(--lms-neutral-100)]" />
    <div className="h-28 animate-pulse rounded-[var(--lms-control-radius,9px)] bg-[var(--lms-neutral-100)]" />
    <div className="grid gap-4 md:grid-cols-2">
      <div className="h-64 animate-pulse rounded-[var(--lms-control-radius,9px)] bg-[var(--lms-neutral-100)]" />
      <div className="h-64 animate-pulse rounded-[var(--lms-control-radius,9px)] bg-[var(--lms-neutral-100)]" />
    </div>
  </div>;
}
