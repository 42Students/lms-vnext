export default function FacultyAttendanceLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading Faculty attendance"
      className="space-y-5"
    >
      <div className="h-28 animate-pulse rounded-xl bg-muted" />
      <div className="h-16 animate-pulse rounded-xl bg-muted" />
      <div className="h-96 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
