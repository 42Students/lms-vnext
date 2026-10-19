export default function RecruiterCompanyReportsLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading recruiter company reports"
      className="space-y-5"
    >
      <div className="h-24 animate-pulse rounded-[var(--lms-radius-card)] bg-muted" />
      <div className="h-12 animate-pulse rounded-[var(--lms-radius-card)] bg-muted" />
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-[var(--lms-radius-card)] bg-muted"
          />
        ))}
      </div>
      <div className="h-32 animate-pulse rounded-[var(--lms-radius-card)] bg-muted" />
      <div className="h-80 animate-pulse rounded-[var(--lms-radius-card)] bg-muted" />
    </div>
  );
}
