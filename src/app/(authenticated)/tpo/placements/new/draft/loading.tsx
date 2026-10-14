export default function Loading() {
  return (
    <section aria-label="Loading draft drive options" aria-busy="true" className="space-y-4">
      <div className="h-20 animate-pulse rounded-lg bg-muted" />
      <div className="h-40 animate-pulse rounded-lg bg-muted" />
      <div className="h-60 animate-pulse rounded-lg bg-muted" />
    </section>
  );
}
