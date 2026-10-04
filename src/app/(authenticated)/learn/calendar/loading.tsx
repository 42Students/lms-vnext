export default function LearnerCalendarLoading() {
  return (
    <div
      className="space-y-6"
      aria-busy="true"
      aria-label="Loading class schedule"
    >
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
      </div>
      <div className="h-[32rem] animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
