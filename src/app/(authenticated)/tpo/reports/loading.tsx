export default function TpoReportsLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading TPO reports"
      className="space-y-5"
    >
      <p role="status" className="text-sm font-semibold text-body">Refreshing report…</p>
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="h-32 animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-xl bg-muted"
          />
        ))}
      </div>
      <div className="h-28 animate-pulse rounded-xl bg-muted" />
      <div className="h-96 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
