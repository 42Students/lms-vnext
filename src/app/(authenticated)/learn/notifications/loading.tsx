export default function LearnerNotificationsLoading() {
  return (
    <div className="space-y-6" role="status" aria-busy="true" aria-label="Loading Learner notifications">
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="flex flex-wrap gap-3">
        {[0, 1, 2, 3, 4].map((index) => (
          <div key={index} className="h-11 w-24 animate-pulse rounded-full bg-muted" />
        ))}
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-28 animate-pulse rounded-xl border border-border bg-surface" />
        ))}
      </div>
    </div>
  );
}
