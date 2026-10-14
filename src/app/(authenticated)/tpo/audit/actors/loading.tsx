export default function Loading() {
  return <section aria-busy="true" aria-label="Loading TPO actor audit" className="space-y-3">
    <div className="h-16 animate-pulse rounded-xl bg-muted" />
    <div className="h-32 animate-pulse rounded-xl bg-muted" />
    <div className="h-56 animate-pulse rounded-xl bg-muted" />
  </section>;
}
