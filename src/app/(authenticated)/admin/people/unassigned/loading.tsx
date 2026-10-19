export default function LoadingUnassignedUsers() {
  return <div role="status" className="space-y-4 py-4 text-sm text-muted-foreground">Loading global identities…
    <div className="h-28 animate-pulse rounded-[var(--lms-control-radius)] bg-surface-subtle" /><div className="h-48 animate-pulse rounded-[var(--lms-control-radius)] bg-surface-subtle" />
  </div>;
}
