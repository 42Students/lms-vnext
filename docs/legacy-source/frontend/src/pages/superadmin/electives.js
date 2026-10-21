import { Alert } from "antd";
import ElectivesConsole from "@/components/admin/electives/ElectivesConsole";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminGroupShell from "@/components/admin/SuperAdminGroupShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";

/** Same console as the college admin, scoped to the college selected in the header. */
export default function SuperAdminElectives() {
  const { selectedCollegeId } = useSuperAdminScope();

  if (selectedCollegeId == null) {
    return (
      <div className="ln-module">
        <Alert type="warning" showIcon style={{ marginBottom: 16 }} message="Select a college to continue"
          description="Choose a college in the header above to see its electives." />
      </div>
    );
  }
  return (
    <div className="ln-module">
      <SuperAdminGroupShell groupKey="academic">
        <ElectivesConsole collegeId={selectedCollegeId} key={selectedCollegeId ?? "none"} />
      </SuperAdminGroupShell>
    </div>
  );
}

SuperAdminElectives.superAdminLayout = SuperAdminLayout;
