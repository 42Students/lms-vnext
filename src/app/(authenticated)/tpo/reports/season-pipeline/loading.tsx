export default function Loading() {
  return (
    <section aria-label="Loading season pipeline" aria-busy="true" className="space-y-4">
      <div className="h-16 animate-pulse rounded-xl bg-muted" />
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="h-48 animate-pulse rounded-xl bg-muted" />
    </section>
  );
}
