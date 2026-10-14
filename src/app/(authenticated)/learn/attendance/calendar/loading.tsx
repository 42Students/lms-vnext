export default function Loading() {
  return <div aria-busy="true" aria-label="Loading attendance calendar" className="space-y-4">
    <div className="h-16 animate-pulse rounded-xl bg-muted" />
    <div className="grid gap-3 sm:grid-cols-4">
      <div className="h-20 animate-pulse rounded-xl bg-muted" />
      <div className="h-20 animate-pulse rounded-xl bg-muted" />
      <div className="h-20 animate-pulse rounded-xl bg-muted" />
      <div className="h-20 animate-pulse rounded-xl bg-muted" />
    </div>
    <div className="h-72 animate-pulse rounded-xl bg-muted" />
  </div>;
}
