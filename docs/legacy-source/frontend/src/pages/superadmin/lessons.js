import { Alert } from "antd";
import Lessons from "./sections/Lessons";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminGroupShell from "@/components/admin/SuperAdminGroupShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";

export default function SuperAdminLessons() {
  const { selectedCollegeId } = useSuperAdminScope();

  if (selectedCollegeId == null) {
    return (
      <div className="ln-module admin-list-page">
        <Alert
          type="warning"
          message="Select a college to continue"
          description="Choose a college in the header above to see its lessons."
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>
    );
  }
  return (
    <div className="ln-module admin-list-page">
      <SuperAdminGroupShell groupKey="content">
        <Lessons collegeId={selectedCollegeId} key={selectedCollegeId ?? "none"} />
      </SuperAdminGroupShell>
    </div>
  );
}

SuperAdminLessons.superAdminLayout = SuperAdminLayout;
