import { Alert } from "antd";
import LectureHalls from "./sections/LectureHalls";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminGroupShell from "@/components/admin/SuperAdminGroupShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";

export default function SuperAdminLectureHalls() {
  const { selectedCollegeId } = useSuperAdminScope();

  if (selectedCollegeId == null) {
    return (
      <div className="ln-module">
        <Alert
          type="warning"
          message="Select a college to continue"
          description="Choose a college in the header above to see its lecture halls."
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>
    );
  }
  return (
    <div className="ln-module">
      <SuperAdminGroupShell groupKey="academic">
        <LectureHalls collegeId={selectedCollegeId} key={selectedCollegeId ?? "none"} />
      </SuperAdminGroupShell>
    </div>
  );
}

SuperAdminLectureHalls.superAdminLayout = SuperAdminLayout;
