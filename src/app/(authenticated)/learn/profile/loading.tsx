export default function LearnerProfileLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading learner profile"
      className="space-y-5"
    >
      <div className="h-28 animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-5 xl:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-44 animate-pulse rounded-xl bg-muted"
          />
        ))}
      </div>
    </div>
  );
}
