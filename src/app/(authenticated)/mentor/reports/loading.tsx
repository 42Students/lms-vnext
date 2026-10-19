export default function Loading(){
  return <section role="status" className="space-y-3 border-b border-border pb-4">
    <div className="h-6 w-64 animate-pulse rounded bg-muted"/>
    <div className="h-32 animate-pulse rounded bg-muted"/>
    <p>Loading registered Mentor reports…</p>
  </section>;
}
