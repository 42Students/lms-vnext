import FeatureControlsHub from "./sections/FeatureControlsHub";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import PageShell from "@/components/Common/PageShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";

// Global page — works with no college/org selected (platform-wide feature flags), so there is no
// "select a college" gate here.
export default function SuperAdminFeatures() {
  const { selectedOrganizationId, selectedCollegeId } = useSuperAdminScope();

  return (
    <div className="ln-module admin-list-page">
      <PageShell title="Feature Controls">
        <FeatureControlsHub
          selectedOrganizationId={selectedOrganizationId}
          selectedCollegeId={selectedCollegeId}
        />
      </PageShell>
    </div>
  );
}

SuperAdminFeatures.superAdminLayout = SuperAdminLayout;
