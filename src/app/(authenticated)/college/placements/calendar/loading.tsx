export default function CollegePlacementCalendarLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading college placement interview calendar"
      className="space-y-5"
    >
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
      </div>
      <div className="h-48 animate-pulse rounded-xl bg-muted" />
      <div className="h-96 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
