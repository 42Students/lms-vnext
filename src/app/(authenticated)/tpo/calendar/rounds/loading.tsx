export default function Loading() {
  return <div aria-busy="true" className="space-y-4">
    <div className="h-16 animate-pulse rounded-lg bg-muted" />
    <div className="h-64 animate-pulse rounded-lg bg-muted" />
  </div>;
}
