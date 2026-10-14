export default function LoadingUnassignedUsers() {
  return <div role="status" className="space-y-4 p-4 text-sm text-muted-foreground">Loading global identities…
    <div className="h-28 animate-pulse rounded-xl bg-muted" /><div className="h-48 animate-pulse rounded-xl bg-muted" />
  </div>;
}
