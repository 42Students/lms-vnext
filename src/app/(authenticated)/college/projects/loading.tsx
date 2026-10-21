import { PageHeader } from "@/components/ui/page-header";
import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

/** GR-19: loading is bounded by a visible recovery action. */
export default function Loading() {
  return <div className="min-w-0 space-y-6">
    <PageHeader title="Project workspaces" description="Live projects, each run by a mentor with a team of students." />
    <p role="status" className="text-sm text-muted-foreground">Opening projects</p>
    <GracefulPageLoading shape="directory" />
  </div>;
}
