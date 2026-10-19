export default function TpoPlacementBrandingLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading placement branding"
      className="space-y-5"
    >
      <div className="h-12 animate-pulse rounded-xl bg-muted" />
      <div className="h-40 animate-pulse rounded-xl bg-muted" />
      <div className="h-48 animate-pulse rounded-xl bg-muted" />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-36 animate-pulse rounded-xl bg-muted" />
        <div className="h-36 animate-pulse rounded-xl bg-muted" />
      </div>

      <div className="h-28 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
