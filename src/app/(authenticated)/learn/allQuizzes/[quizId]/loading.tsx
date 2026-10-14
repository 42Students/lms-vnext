export default function LearnerQuizHistoryLoading() {
  return <div aria-busy="true" className="animate-pulse space-y-4">
    <div className="h-8 w-64 max-w-full rounded bg-muted" />
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="h-28 rounded-xl border border-border bg-surface" />
      <div className="h-28 rounded-xl border border-border bg-surface" />
    </div>
  </div>;
}