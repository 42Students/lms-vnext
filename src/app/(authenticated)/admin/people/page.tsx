import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default function SuperAdminPeoplePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="People"
        description="People management is intentionally college-scoped even for platform administrators."
      />
      <EmptyState
        title="Select a college scope"
        description="A scoped people view will use the existing server-authorized People APIs without introducing a client-controlled tenant boundary."
      />
    </div>
  );
}
