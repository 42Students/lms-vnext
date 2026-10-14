export default function Loading() {
  return <div aria-busy="true" aria-label="Loading Faculty contact detail" className="space-y-4">
    <div className="h-20 animate-pulse rounded-xl bg-muted" />
    <div className="h-24 animate-pulse rounded-xl bg-muted" />
    <div className="h-56 animate-pulse rounded-xl bg-muted" />
  </div>;
}
