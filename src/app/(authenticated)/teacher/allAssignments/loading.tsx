export default function FacultyAssignmentsOverviewLoading() {
  return (
    <div aria-busy="true" aria-label="Loading assignments" className="space-y-5">
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="h-28 animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-48 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
