export default function TpoProfileLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading your TPO profile"
      className="space-y-5"
    >
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      </div>
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
