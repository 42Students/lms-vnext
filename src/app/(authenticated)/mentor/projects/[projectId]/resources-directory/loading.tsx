export default function Loading(){
 return <section role="status" aria-busy="true" className="space-y-3 border-b border-[var(--lms-canvas-border)] pb-4">
  <div className="h-6 w-60 animate-pulse rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-100)]"/>
  <div className="h-24 animate-pulse rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-100)]"/>
  <p>Loading registered project resources…</p>
 </section>;
}
