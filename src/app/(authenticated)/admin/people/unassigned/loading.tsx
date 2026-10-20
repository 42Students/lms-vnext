import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

export default function LoadingUnassignedUsers() {
  return <section aria-label="Loading unassigned identities" className="space-y-4 py-4">
    <p role="status" className="text-sm text-muted-foreground">Loading global identities…</p>
    <GracefulPageLoading label="Loading global identities…" shape="directory" />
  </section>;
}
