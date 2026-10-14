export default function ProfileChecklistLoading() {
  return <div aria-busy="true" className="animate-pulse space-y-5">
    <div className="h-9 w-72 max-w-full rounded bg-muted" />
    <div className="h-28 rounded-xl border border-border bg-surface" />
    <div className="grid gap-3 sm:grid-cols-2">
      {[1,2,3,4].map(id=><div key={id} className="h-14 rounded-lg border border-border bg-surface" />)}
    </div>
  </div>;
}