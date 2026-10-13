export default function FacultyClassScheduleLoading() {
  return (
    <div aria-busy="true" aria-label="Loading Class Schedule" className="space-y-4">
      <div className="h-20 animate-pulse rounded-xl bg-muted" />
      <div className="h-32 animate-pulse rounded-xl bg-muted" />
      <div className="h-48 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
