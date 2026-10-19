export default function TpoWhatCompaniesSeeLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading company visibility settings"
      className="space-y-5"
    >
      <div className="h-12 animate-pulse rounded-xl bg-muted" />

      <div className="h-44 animate-pulse rounded-xl bg-muted" />

      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-xl bg-muted"
          />
        ))}
      </div>

      <div className="h-32 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
