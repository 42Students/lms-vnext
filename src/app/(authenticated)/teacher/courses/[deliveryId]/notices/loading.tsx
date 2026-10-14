export default function Loading(){
  return <div aria-busy="true" aria-label="Loading Section notices" className="space-y-3">
    <div className="h-16 animate-pulse rounded-xl bg-muted" />
    <div className="h-44 animate-pulse rounded-xl bg-muted" />
  </div>;
}
