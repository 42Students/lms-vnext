export default function Loading() {
  return (
    <section aria-busy="true" aria-label="Loading Drive Day no-show report" className="space-y-4">
      <div className="h-16 animate-pulse rounded-xl bg-muted" />
      <div className="h-28 animate-pulse rounded-xl bg-muted" />
      <div className="h-56 animate-pulse rounded-xl bg-muted" />
    </section>
  );
}
