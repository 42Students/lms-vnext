export default function LearnerPlacementsLoading() {
  return (
    <main aria-busy="true" aria-label="Loading placement dashboard" className="space-y-5">
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="h-36 animate-pulse rounded-xl border border-border bg-surface" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((value) => (
          <div key={value} className="h-28 animate-pulse rounded-xl border border-border bg-surface" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-56 animate-pulse rounded-xl border border-border bg-surface" />
        <div className="h-56 animate-pulse rounded-xl border border-border bg-surface" />
      </div>
    </main>
  );
}
