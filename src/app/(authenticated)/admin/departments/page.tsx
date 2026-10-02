import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default function SuperAdminDepartmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Departments"
        description="Department administration is tenant-scoped."
      />
      <EmptyState
        title="Select a college scope"
        description="The backend already enforces college ownership. The Super Admin scope selector is the next UI step before department records are shown here."
      />
    </div>
  );
}
