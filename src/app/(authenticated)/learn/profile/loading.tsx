export default function LearnerProfileLoading(){
  return <div aria-busy="true" aria-label="Loading learner profile" className="space-y-6">
    <p role="status" className="sr-only">Loading your saved learner profile</p>
    <div aria-hidden="true" className="h-24 animate-pulse rounded-xl bg-muted" />
    <section aria-hidden="true" className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-6">
      <div className="h-4 w-36 animate-pulse rounded bg-muted" />
      <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[0,1,2].map(x=><div key={x} className="h-12 animate-pulse rounded bg-muted" />)}</div>
    </section>
    <div aria-hidden="true" className="space-y-5">
      <div className="h-52 animate-pulse rounded-xl border border-border bg-surface" />
      <div className="grid gap-5 lg:grid-cols-2">{[0,1,2,3,4,5].map(x=><div key={x} className="h-44 animate-pulse rounded-xl border border-border bg-surface" />)}</div>
    </div>
  </div>;
}
