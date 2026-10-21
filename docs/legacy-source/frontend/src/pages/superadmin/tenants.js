import TenantsHub from "./sections/TenantsHub";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import PageShell from "@/components/Common/PageShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";

// Global page — works with no college/org selected (platform-wide tenant setup), unlike every
// grouped page, so there is no "select a college" gate here.
export default function SuperAdminTenants() {
  const { selectedOrganizationId, selectedCollegeId } = useSuperAdminScope();

  return (
    <div className="ln-module admin-list-page">
      <PageShell title="Tenant Setup">
        <TenantsHub
          selectedOrganizationId={selectedOrganizationId}
          selectedCollegeId={selectedCollegeId}
        />
      </PageShell>
    </div>
  );
}

SuperAdminTenants.superAdminLayout = SuperAdminLayout;
