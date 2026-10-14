export default function Loading(){
  return <div aria-busy="true" aria-label="Loading Faculty Quiz attempts" className="space-y-4">
    <div className="h-16 animate-pulse rounded-xl bg-muted" />
    <div className="h-28 animate-pulse rounded-xl bg-muted" />
    <div className="h-64 animate-pulse rounded-xl bg-muted" />
  </div>;
}
