export default function SuperAdminAttendanceLoading() {
  return (
    <div aria-busy="true" aria-label="Loading scoped attendance" className="space-y-5">
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="h-28 animate-pulse rounded-xl bg-muted" />
      <div className="h-96 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
