export default function LearnerJobDetailLoading() {
  return (
    <main aria-busy="true" aria-label="Loading placement job details" className="space-y-5">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-muted" />
      <div className="h-56 animate-pulse rounded-xl border border-border bg-surface" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-xl border border-border bg-surface" />
        <div className="h-80 animate-pulse rounded-xl border border-border bg-surface" />
      </div>
    </main>
  );
}
