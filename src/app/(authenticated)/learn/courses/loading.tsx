export default function LearnerCoursesLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="animate-pulse border-b border-border pb-5">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="mt-3 h-8 w-64 rounded bg-muted" />
        <div className="mt-3 h-4 w-80 max-w-full rounded bg-muted" />
      </div>
      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-10 w-28 shrink-0 animate-pulse rounded bg-muted" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="h-64 animate-pulse rounded-xl border border-border bg-surface" />
        ))}
      </div>
    </div>
  );
}
