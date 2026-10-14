export default function Loading() {
  return <div aria-busy="true" aria-label="Loading placement preparation" className="space-y-4">
    <div className="h-16 animate-pulse rounded-xl bg-muted" />
    <div className="h-28 animate-pulse rounded-xl bg-muted" />
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="h-40 animate-pulse rounded-xl bg-muted" />
      <div className="h-40 animate-pulse rounded-xl bg-muted" />
    </div>
  </div>;
}
