import { Alert, Card, Typography } from "antd";
import PolicySettingField from "@/components/admin/PolicySettingField";
import Courses from "./sections/Courses";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminGroupShell from "@/components/admin/SuperAdminGroupShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";

export default function SuperAdminCourses() {
  const { selectedCollegeId } = useSuperAdminScope();

  if (selectedCollegeId == null) {
    return (
      <div className="ln-module admin-list-page">
        <Alert
          type="warning"
          message="Select a college to continue"
          description="Choose a college in the header above to see its courses."
          showIcon
          style={{ marginBottom: 16 }}
        />
        {/* BE-0126: the platform-wide progress policy is edited here, with no college selected (as the server requires). */}
        <Card size="small" title="Progress policy" style={{ marginBottom: 16 }} data-testid="course-progress-policy-card">
          <Typography.Paragraph type="secondary">Platform-wide: applies to every college.</Typography.Paragraph>
          <PolicySettingField scopeType="GLOBAL" settingKey="course.minInProgressPercent"
            label="In progress lower bound" help="Below this percentage a video counts as not started."
            defaultValue={5} min={0} max={99} suffix="%" />
        </Card>
      </div>
    );
  }
  return (
    <div className="ln-module admin-list-page">
      <SuperAdminGroupShell groupKey="content">
        <Courses collegeId={selectedCollegeId} key={selectedCollegeId ?? "none"} />
      </SuperAdminGroupShell>
    </div>
  );
}

SuperAdminCourses.superAdminLayout = SuperAdminLayout;
