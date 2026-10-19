export default function Loading(){
  return <section role="status" aria-busy="true" className="space-y-4 border-b border-[var(--lms-canvas-border)] pb-4">
    <div className="h-7 w-2/3 animate-pulse rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-100)]"/>
    <div className="h-24 animate-pulse rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-100)]"/>
    <p>Loading the recorded review…</p>
  </section>;
}
