export default function Loading() {
  return <section aria-busy="true" className="space-y-4">
    <div className="h-16 animate-pulse rounded-[var(--radius)] bg-muted" />
    <div className="h-56 animate-pulse rounded-[var(--radius)] bg-muted" />
  </section>;
}