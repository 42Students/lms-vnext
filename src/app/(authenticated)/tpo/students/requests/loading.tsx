export default function TpoStudentRequestsLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading TPO Student Requests"
      className="space-y-5"
    >
      <div className="h-24 animate-pulse rounded-[var(--lms-canvas-radius)] bg-muted" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-[var(--lms-canvas-radius)] bg-muted"
          />
        ))}
      </div>

      <div className="h-24 animate-pulse rounded-[var(--lms-canvas-radius)] bg-muted" />
      <div className="h-96 animate-pulse rounded-[var(--lms-canvas-radius)] bg-muted" />
    </div>
  );
}
