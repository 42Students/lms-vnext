export default function FacultyDetailLoading() {
  return <div aria-label="Loading faculty record" aria-busy="true" className="space-y-4">
    <div className="h-16 animate-pulse rounded-[var(--lms-control-radius,9px)] bg-[var(--lms-neutral-100)]" /><div className="h-64 animate-pulse rounded-[var(--lms-control-radius,9px)] bg-[var(--lms-neutral-100)]" />
  </div>;
}
