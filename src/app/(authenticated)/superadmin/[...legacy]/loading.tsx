/** The legacy client used six pulsing Skeleton paragraphs before routing.
 * Server redirects normally skip this fallback, but streaming/slow navigation
 * retains its accessible single-column silhouette on every viewport. */
export default function Loading() {
  return <div className="min-w-0 max-w-full space-y-4" role="status" aria-live="polite" aria-label="Opening Super Admin workspace">
    <span className="sr-only">Opening Super Admin workspace…</span>
    <div aria-hidden="true" className="space-y-3 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-5 motion-safe:animate-pulse">
      {Array.from({length:6},(_,index)=>
        <div key={index} className="h-4 rounded bg-[var(--lms-primary-subtle)]"
          style={{width: index===5?"58%":index%2===0?"93%":"81%"}}/>)}
    </div>
  </div>;
}
