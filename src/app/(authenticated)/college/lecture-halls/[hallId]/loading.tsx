export default function CollegeHallAvailabilityLoading() {
  return <div aria-busy="true" aria-label="Loading hall availability" className="space-y-4">
    <div className="h-20 animate-pulse rounded-xl bg-muted" />
    <div className="h-24 animate-pulse rounded-xl bg-muted" />
    <div className="h-72 animate-pulse rounded-xl bg-muted" />
  </div>;
}
