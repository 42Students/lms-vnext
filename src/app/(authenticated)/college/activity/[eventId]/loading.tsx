export default function CollegeActivityDetailLoading() {
  return <div aria-busy="true" aria-label="Loading activity detail" className="space-y-4">
    <div className="h-16 animate-pulse rounded-[var(--lms-control-radius,9px)] bg-[var(--lms-neutral-100)]" />
    <div className="h-40 animate-pulse rounded-[var(--lms-control-radius,9px)] bg-[var(--lms-neutral-100)]" />
  </div>;
}
