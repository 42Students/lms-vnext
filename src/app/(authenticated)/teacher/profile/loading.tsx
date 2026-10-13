export default function FacultyProfileLoading() {
  return (
    <div aria-busy="true" aria-label="Loading faculty profile" className="space-y-5">
      <div className="h-28 animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}
