export default function TpoStudentsLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading TPO Students intelligence"
      className="space-y-5"
    >
      <div className="h-24 animate-pulse rounded-[12px] bg-muted" />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-[12px] bg-muted"
          />
        ))}
      </div>

      <div className="h-64 animate-pulse rounded-[12px] bg-muted" />
      <div className="h-24 animate-pulse rounded-[12px] bg-muted" />
      <div className="h-96 animate-pulse rounded-[12px] bg-muted" />
    </div>
  );
}
