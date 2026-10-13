export default function TpoMoreLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading TPO More navigation"
      className="space-y-5"
    >
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from(
          { length: 4 },
          (_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-xl bg-muted"
            />
          ),
        )}
      </div>
    </div>
  );
}
