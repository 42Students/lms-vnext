export default function Loading() {
  return <section aria-busy="true" className="space-y-4">
    <div className="h-16 animate-pulse rounded-md bg-muted" />
    <div className="h-64 animate-pulse rounded-md bg-muted" />
  </section>;
}
