export default function Loading() {
  return <div aria-busy="true" aria-label="Loading project activity" className="space-y-5">
    <div className="h-16 animate-pulse rounded-xl bg-muted" />
    <div className="h-20 animate-pulse rounded-xl bg-muted" />
    <div className="h-72 animate-pulse rounded-xl bg-muted" />
  </div>;
}
