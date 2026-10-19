export default function Loading(){
  return <section role="status" className="space-y-4 border-b border-border pb-4">
    <div className="h-7 w-2/3 animate-pulse rounded bg-muted"/>
    <div className="h-24 animate-pulse rounded bg-muted"/>
    <p>Loading the recorded review…</p>
  </section>;
}
