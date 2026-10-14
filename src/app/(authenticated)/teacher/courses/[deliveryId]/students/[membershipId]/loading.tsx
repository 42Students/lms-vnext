export default function Loading() {
  return <div aria-busy="true" aria-label="Loading Faculty student details" className="space-y-4">
    <div className="h-20 animate-pulse rounded-xl bg-muted" />
    <div className="h-28 animate-pulse rounded-xl bg-muted" />
    <div className="h-64 animate-pulse rounded-xl bg-muted" />
  </div>;
}
