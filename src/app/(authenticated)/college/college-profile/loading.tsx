export default function CollegeContactProfileLoading() {
  return <div aria-busy="true" aria-label="Loading college contact profile" className="space-y-4">
    <div className="h-16 animate-pulse rounded-xl bg-muted" />
    <div className="h-48 animate-pulse rounded-xl bg-muted" />
    <div className="h-48 animate-pulse rounded-xl bg-muted" />
  </div>;
}
