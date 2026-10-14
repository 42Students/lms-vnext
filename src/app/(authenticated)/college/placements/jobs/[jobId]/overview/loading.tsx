export default function Loading() {
  return <div aria-label="Loading drive overview" aria-busy="true" className="space-y-4">
    <div className="h-20 animate-pulse rounded-xl bg-muted" /><div className="h-44 animate-pulse rounded-xl bg-muted" />
  </div>;
}
