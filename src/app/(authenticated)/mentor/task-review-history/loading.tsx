export default function Loading() {
  return <div aria-busy="true" aria-label="Loading reviewed task submissions" className="space-y-4">
    <div className="h-16 animate-pulse rounded-xl bg-muted" />
    <div className="h-32 animate-pulse rounded-xl bg-muted" />
    <div className="h-64 animate-pulse rounded-xl bg-muted" />
  </div>;
}
