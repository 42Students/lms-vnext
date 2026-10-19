export default function Loading(){
  return <div aria-busy="true" aria-label="Loading published learner scores" className="space-y-3">
    <div className="h-14 animate-pulse rounded-[var(--lms-canvas-radius)] bg-muted"/>
    <div className="h-64 animate-pulse rounded-[var(--lms-canvas-radius)] bg-muted"/>
  </div>;
}
