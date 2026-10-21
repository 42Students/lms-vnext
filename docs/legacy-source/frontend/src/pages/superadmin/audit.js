import AuditHub from "./sections/AuditHub";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import PageShell from "@/components/Common/PageShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";

// Global page — works with no college/org selected (platform-wide activity log, via AuditHub's
// allowGlobal), so there is no "select a college" gate here. Distinct from
// src/pages/college-admin/audit.js, which renders AuditLogs directly rather than AuditHub.
export default function SuperAdminAudit() {
  const { selectedOrganizationId, selectedCollegeId } = useSuperAdminScope();

  return (
    <div className="ln-module admin-list-page">
      <PageShell title="Activity Log">
        <AuditHub
          selectedOrganizationId={selectedOrganizationId}
          selectedCollegeId={selectedCollegeId}
        />
      </PageShell>
    </div>
  );
}

SuperAdminAudit.superAdminLayout = SuperAdminLayout;
