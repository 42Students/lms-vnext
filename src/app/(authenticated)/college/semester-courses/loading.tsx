export default function SemesterCoursesLoading() {
  return <div aria-label="Loading course mappings" aria-busy="true" className="space-y-4">
    <div className="h-16 animate-pulse rounded-xl bg-muted" />
    <div className="h-24 animate-pulse rounded-xl bg-muted" />
    <div className="h-72 animate-pulse rounded-xl bg-muted" />
  </div>;
}
