export default function FacultyDirectoryLoading() {
  return (
    <div aria-busy="true" aria-label="Loading College Faculty directory" className="space-y-4">
      <div className="h-16 animate-pulse rounded-[var(--lms-control-radius,9px)] bg-[var(--lms-neutral-100)]" />
      <div className="h-24 animate-pulse rounded-[var(--lms-control-radius,9px)] bg-[var(--lms-neutral-100)]" />
      <div className="h-72 animate-pulse rounded-[var(--lms-control-radius,9px)] bg-[var(--lms-neutral-100)]" />
    </div>
  );
}
