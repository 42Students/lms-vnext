export default function CollegeCorrectionReadLoading() {
  return <div aria-busy="true" aria-label="Loading attendance corrections" className="space-y-4">
    <div className="h-20 animate-pulse rounded-[var(--lms-control-radius,9px)] bg-[var(--lms-neutral-100)]"/>
    <div className="h-24 animate-pulse rounded-[var(--lms-control-radius,9px)] bg-[var(--lms-neutral-100)]"/>
    <div className="h-72 animate-pulse rounded-[var(--lms-control-radius,9px)] bg-[var(--lms-neutral-100)]"/>
  </div>;
}
