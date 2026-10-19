export default function Loading() {
  return (
    <section aria-busy="true" aria-label="Loading Companies · Feedback" className="space-y-4">
      <div className="h-16 animate-pulse rounded-[12px] bg-muted" />
      <div className="h-24 animate-pulse rounded-[12px] bg-muted" />
      <div className="h-48 animate-pulse rounded-[12px] bg-muted" />
    </section>
  );
}
