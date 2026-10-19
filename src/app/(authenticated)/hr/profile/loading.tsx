export default function RecruiterProfileLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading your recruiter profile"
      className="space-y-5"
    >
      <div className="h-24 animate-pulse rounded-[var(--lms-radius-card)] bg-muted" />
      <div className="h-40 animate-pulse rounded-[var(--lms-radius-card)] bg-muted" />
      <div className="h-28 animate-pulse rounded-[var(--lms-radius-card)] bg-muted" />
      <div className="h-48 animate-pulse rounded-[var(--lms-radius-card)] bg-muted" />
    </div>
  );
}
