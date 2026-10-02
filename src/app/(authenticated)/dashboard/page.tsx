import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Core platform"
        title="Dashboard"
        description="Your vNext workspace is connected to the canonical identity, membership, and tenant authorization model."
      />
      <EmptyState
        title="Dashboard modules are coming next"
        description="The authenticated shell is now in place. Administration pages will populate this workspace without changing the LMS visual identity."
      />
    </div>
  );
}
