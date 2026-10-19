export default function HrCalendarLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading recruiter calendar"
      className="space-y-5"
    >
      <div className="h-24 animate-pulse rounded-[var(--lms-radius-card)] bg-muted" />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from(
          { length: 4 },
          (_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-[var(--lms-radius-card)] bg-muted"
            />
          ),
        )}
      </div>

      <div className="h-36 animate-pulse rounded-[var(--lms-radius-card)] bg-muted" />

      <div className="h-96 animate-pulse rounded-[var(--lms-radius-card)] bg-muted" />
    </div>
  );
}
