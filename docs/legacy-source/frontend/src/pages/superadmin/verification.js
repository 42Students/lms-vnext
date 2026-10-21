import { Alert } from "antd";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import PageShell from "@/components/Common/PageShell";
import VerificationWorkspace from "@/components/verification/VerificationWorkspace";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";

/** Profile verification for the super admin, for the college chosen in the scope picker. */
export default function SuperAdminProfileVerification() {
  const { selectedCollegeId } = useSuperAdminScope();
  return (
    <div className="ln-module admin-list-page">
      <PageShell title="Profile verification" subtitle="Students' education and identity, checked against their documents.">
        {selectedCollegeId
          ? <VerificationWorkspace key={selectedCollegeId} collegeId={selectedCollegeId} canChangeSetting />
          : <Alert type="info" showIcon message="Choose a college at the top to see its students waiting for verification." />}
      </PageShell>
    </div>
  );
}

SuperAdminProfileVerification.superAdminLayout = SuperAdminLayout;
