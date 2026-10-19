export default function Loading() {
  return <main className="space-y-4 px-2" aria-busy="true">
    <div role="status" className="text-sm text-muted-foreground">Loading your notices…</div>
    <div className="h-20 animate-pulse rounded-xl bg-muted" />
    <div className="h-20 animate-pulse rounded-xl bg-muted" />
  </main>;
}
