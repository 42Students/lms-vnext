export default function Loading() {
  return (
    <section aria-busy="true" aria-label="Loading cancellation preview" className="space-y-3">
      <div className="h-16 animate-pulse rounded-xl bg-muted" />
      <div className="h-44 animate-pulse rounded-xl bg-muted" />
    </section>
  );
}
