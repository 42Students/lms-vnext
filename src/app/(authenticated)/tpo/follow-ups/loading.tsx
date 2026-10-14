export default function Loading() {
  return (
    <section aria-busy="true" aria-label="Loading TPO due follow-ups" className="space-y-4">
      <div className="h-20 animate-pulse rounded-xl bg-muted" />
      <div className="h-36 animate-pulse rounded-xl bg-muted" />
      <div className="h-56 animate-pulse rounded-xl bg-muted" />
    </section>
  );
}
