export default function TpoTrustedCompaniesLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading Trusted Companies"
      className="space-y-5"
    >
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-xl bg-muted"
          />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-xl bg-muted" />
      <div className="h-56 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
