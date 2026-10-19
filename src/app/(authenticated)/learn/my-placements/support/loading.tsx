export default function LearnerSupportLoading() {
  return <div aria-busy="true" className="animate-pulse space-y-4">
    <div className="h-8 w-64 max-w-full rounded bg-muted" />
    <div className="h-24 rounded-xl border border-border bg-muted" />
    <div className="grid gap-3 sm:grid-cols-2">
      {[1,2,3,4].map(n=><div key={n} className="h-28 rounded-xl border border-border bg-muted" />)}
    </div>
  </div>;
}