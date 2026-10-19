export default function Loading(){
  return <section role="status" aria-busy="true" className="space-y-4 border-b border-[var(--lms-canvas-border)] pb-4">
    <div className="h-7 w-2/3 animate-pulse rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-100)]"/>
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="h-28 animate-pulse rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-100)]"/>
      <div className="h-28 animate-pulse rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-100)]"/>
    </div>
    <p>Loading project evidence…</p>
  </section>;
}
