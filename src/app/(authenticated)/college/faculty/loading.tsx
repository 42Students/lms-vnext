export default function FacultyDirectoryLoading() {
  return (
    <div aria-busy="true" aria-label="Loading College Faculty directory" className="space-y-4">
      <div className="h-16 animate-pulse rounded-xl bg-muted" />
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="h-72 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
