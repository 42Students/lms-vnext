export default function Loading() {
  return <section aria-busy="true" aria-label="Loading TPO performance intelligence"
    className="space-y-4">
    <div className="h-16 animate-pulse rounded-xl bg-muted" />
    <div className="h-40 animate-pulse rounded-xl bg-muted" />
    <div className="h-48 animate-pulse rounded-xl bg-muted" />
  </section>;
}
