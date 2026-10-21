import { Alert } from "antd";
import Programs from "./sections/Programs";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminGroupShell from "@/components/admin/SuperAdminGroupShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";

export default function SuperAdminPrograms() {
  const { selectedCollegeId } = useSuperAdminScope();

  if (selectedCollegeId == null) {
    return (
      <div className="ln-module admin-list-page">
        <Alert
          type="warning"
          message="Select a college to continue"
          description="Choose a college in the header above to see its programs."
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>
    );
  }
  return (
    <div className="ln-module admin-list-page">
      <SuperAdminGroupShell groupKey="academic">
        <Programs collegeId={selectedCollegeId} key={selectedCollegeId ?? "none"} />
      </SuperAdminGroupShell>
    </div>
  );
}

SuperAdminPrograms.superAdminLayout = SuperAdminLayout;
