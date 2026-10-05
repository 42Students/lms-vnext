export default function LearnerAssessmentsLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="animate-pulse border-b border-border pb-5">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="mt-3 h-8 w-64 rounded bg-muted" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-muted" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[1,2,3].map((item) => (
          <div key={item} className="h-24 animate-pulse rounded-xl border border-border bg-surface" />
        ))}
      </div>
      <div className="h-12 animate-pulse rounded-xl border border-border bg-surface" />
      {[1,2,3,4].map((item) => (
        <div key={item} className="h-32 animate-pulse rounded-xl border border-border bg-surface" />
      ))}
    </div>
  );
}
