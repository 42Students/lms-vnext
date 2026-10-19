export default function CollegeAcademicsLoading() {
  return <div aria-label="Loading college academics" aria-busy="true" className="space-y-4">
    <div className="h-20 animate-pulse rounded-[var(--lms-control-radius,9px)] bg-[var(--lms-neutral-100)]" />
    <div className="h-72 animate-pulse rounded-[var(--lms-control-radius,9px)] bg-[var(--lms-neutral-100)]" />
  </div>;
}
