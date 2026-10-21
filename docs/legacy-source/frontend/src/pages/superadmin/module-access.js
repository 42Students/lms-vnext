import { Alert } from "antd";
import ModuleAccess from "./sections/ModuleAccess";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import PageShell from "@/components/Common/PageShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";

// Not a global page: every level below GLOBAL hangs off a college, so a college must be selected
// before there is anything to show.
export default function SuperAdminModuleAccess() {
  const { selectedCollegeId } = useSuperAdminScope();

  return (
    <div className="ln-module admin-list-page">
      <PageShell title="Module Access">
        {selectedCollegeId == null ? (
          <Alert
            type="warning"
            message="Select a college to continue"
            description="Module access is deliberately college-scoped. Choose a college in the header to inspect inherited access without mixing tenants."
            showIcon
          />
        ) : (
          <ModuleAccess collegeId={selectedCollegeId} isSuperAdmin key={selectedCollegeId ?? "none"} />
        )}
      </PageShell>
    </div>
  );
}

SuperAdminModuleAccess.superAdminLayout = SuperAdminLayout;
