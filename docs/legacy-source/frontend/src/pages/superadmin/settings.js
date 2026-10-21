import TenantSettings from "./sections/TenantSettings";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import PageShell from "@/components/Common/PageShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";

// Global page — the GLOBAL scope works with no college/org selected, and the scope selector
// inside the section tells the admin when a selection is needed for ORG/COLLEGE. So no
// "select a college" gate here, matching /superadmin/features.
export default function SuperAdminSettings() {
  const { selectedOrganizationId, selectedCollegeId } = useSuperAdminScope();

  return (
    <div className="ln-module admin-list-page">
      <PageShell title="Tenant Settings">
        <TenantSettings
          selectedOrganizationId={selectedOrganizationId}
          selectedCollegeId={selectedCollegeId}
        />
      </PageShell>
    </div>
  );
}

SuperAdminSettings.superAdminLayout = SuperAdminLayout;
