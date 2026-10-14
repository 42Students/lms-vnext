export default function CollegePeopleLoading() {
  return <div className="space-y-4" role="status" aria-live="polite">
    <div className="h-8 w-40 animate-pulse rounded bg-muted" />
    <div className="h-20 animate-pulse rounded-xl bg-muted" />
    <div className="h-64 animate-pulse rounded-xl bg-muted" />
    <p className="text-sm text-muted-foreground">Loading college people…</p>
  </div>;
}
