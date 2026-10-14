export default function Loading(){
  return <div aria-label="Loading authorized submissions" aria-busy="true" className="space-y-4">
    <div className="h-16 animate-pulse rounded-xl bg-muted"/>
    <div className="h-32 animate-pulse rounded-xl bg-muted"/>
    <div className="h-72 animate-pulse rounded-xl bg-muted"/>
  </div>;
}
