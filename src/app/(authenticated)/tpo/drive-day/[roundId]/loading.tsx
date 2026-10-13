export default function RoundDriveDayLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading Drive Day round"
      className="space-y-6"
    >
      <div className="h-24 animate-pulse rounded-xl bg-muted" />

      <div className="h-40 animate-pulse rounded-xl bg-muted" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from(
          { length: 4 },
          (_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-xl bg-muted"
            />
          ),
        )}
      </div>

      <div className="h-80 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
