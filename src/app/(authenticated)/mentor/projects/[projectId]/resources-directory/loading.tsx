export default function Loading(){
 return <section role="status" className="space-y-3 rounded-xl border border-border bg-surface p-5">
  <div className="h-6 w-60 animate-pulse rounded bg-muted"/>
  <div className="h-24 animate-pulse rounded bg-muted"/>
  <p>Loading registered project resources…</p>
 </section>;
}
