import { Alert } from "antd";
import PeopleDirectory from "./sections/PeopleDirectory";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminGroupShell from "@/components/admin/SuperAdminGroupShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";

export default function SuperAdminPeopleDirectory() {
  const { selectedCollegeId } = useSuperAdminScope();

  if (selectedCollegeId == null) {
    return (
      <div className="ln-module admin-list-page">
        <Alert
          type="warning"
          message="Select a college to continue"
          description="Choose a college in the header above to see its people directory."
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>
    );
  }
  return (
    <div className="ln-module admin-list-page">
      <SuperAdminGroupShell groupKey="people">
        <PeopleDirectory collegeId={selectedCollegeId} key={selectedCollegeId ?? "none"} />
      </SuperAdminGroupShell>
    </div>
  );
}

SuperAdminPeopleDirectory.superAdminLayout = SuperAdminLayout;
