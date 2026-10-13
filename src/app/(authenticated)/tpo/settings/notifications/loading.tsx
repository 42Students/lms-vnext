export default function TpoMyNotificationsLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading TPO notification preferences"
      className="space-y-5"
    >
      <div className="h-12 animate-pulse rounded-xl bg-muted" />
      <div className="h-24 animate-pulse rounded-xl bg-muted" />

      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-xl bg-muted"
          />
        ))}
      </div>

      <div className="h-28 animate-pulse rounded-xl bg-muted" />
      <div className="h-72 animate-pulse rounded-xl bg-muted" />
      <div className="h-72 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
