export default function Loading(){
  return <section role="status" className="space-y-4 rounded-xl border border-border bg-surface p-5">
    <div className="h-7 w-2/3 animate-pulse rounded bg-muted"/>
    <div className="h-32 animate-pulse rounded bg-muted"/>
    <p>Loading meeting notes…</p>
  </section>;
}
