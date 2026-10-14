export default function Loading(){
  return <div aria-busy="true" aria-label="Loading published learner scores" className="space-y-3">
    <div className="h-14 animate-pulse rounded-lg bg-muted"/>
    <div className="h-64 animate-pulse rounded-lg bg-muted"/>
  </div>;
}
