export default function LearnerCalendarLoading(){
  return <div aria-busy="true" aria-label="Loading your career calendar" className="space-y-5">
    <p role="status" className="sr-only">Loading your career calendar</p>
    <div aria-hidden="true" className="h-24 animate-pulse rounded-xl bg-muted" />
    <div aria-hidden="true" className="h-56 animate-pulse rounded-xl border border-border bg-surface" />
    <div aria-hidden="true" className="grid gap-3 sm:grid-cols-2">{[0,1,2,3].map(x=><div key={x} className="h-28 animate-pulse rounded-xl bg-muted" />)}</div>
  </div>;
}
