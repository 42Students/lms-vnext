export default function FacultyContactsLoading() {
  return (
    <div aria-busy="true" aria-label="Loading contacts" className="space-y-5">
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="h-14 animate-pulse rounded-xl bg-muted" />
      <div className="h-80 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
