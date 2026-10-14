export default function LearnerInterviewLoading() {
  return (
    <div aria-busy="true" className="space-y-4 animate-pulse">
      <div className="h-8 w-60 max-w-full rounded bg-muted" />
      <div className="h-24 rounded-xl border border-border bg-surface" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-36 rounded-xl border border-border bg-surface" />
        <div className="h-36 rounded-xl border border-border bg-surface" />
      </div>
    </div>
  );
}
