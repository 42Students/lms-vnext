import { Alert, Card } from "antd";
import PolicySettingField from "@/components/admin/PolicySettingField";
import { useRouter } from "next/router";
import LessonContent from "./sections/LessonContent";
import AdminResources from "./sections/AdminResources";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminGroupShell from "@/components/admin/SuperAdminGroupShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";

export default function SuperAdminLessonContent() {
  const {
    selectedCollegeId,
    scopeLoaded,
    scopeApplying,
    scopeOutOfSync,
    scopeApplyError,
  } = useSuperAdminScope();
  const router = useRouter();

  // The scope provider restores the saved college before the matching JWT is
  // necessarily minted. Do not fire college-scoped requests using an old token.
  if (!scopeLoaded || scopeApplying || scopeOutOfSync || scopeApplyError) {
    return (
      <div className="ln-module admin-list-page">
        <Alert
          type={scopeApplyError ? "error" : "info"}
          message={scopeApplyError ? "College scope could not be applied" : "Applying college scope"}
          description={scopeApplyError
            ? "Select the college again in the header or refresh before editing lesson content."
            : "Lesson content is available after your selected college and access token agree."}
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>
    );
  }

  if (selectedCollegeId == null) {
    return (
      <div className="ln-module admin-list-page">
        <Alert
          type="warning"
          message="Select a college to continue"
          description="Choose a college in the header above to see its lesson content."
          showIcon
          style={{ marginBottom: 16 }}
        />
        {/* BE-0170: the platform-wide video policy is edited here, with no college selected (as the server requires). */}
        {router.query.type === "video" && (
          <Card size="small" title="Video policy" style={{ marginBottom: 16 }} data-testid="video-policy-card">
            <div style={{ marginBottom: 8, color: "#888", fontSize: 12 }}>Platform-wide: applies to every college.</div>
            <PolicySettingField
              scopeType="GLOBAL"
              settingKey="course.watchedThresholdPercent"
              label="Video &quot;watched&quot; threshold"
              help="How far into a video counts as watched, for progress and lesson completion."
              defaultValue={90}
              min={1}
              max={100}
              suffix="%"
            />
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="ln-module admin-list-page">
      <SuperAdminGroupShell groupKey="content">
        {router.query.type === "resources"
          ? <AdminResources collegeId={selectedCollegeId} key={selectedCollegeId ?? "none"} />
          : <LessonContent collegeId={selectedCollegeId} key={selectedCollegeId ?? "none"} />}
      </SuperAdminGroupShell>
    </div>
  );
}

SuperAdminLessonContent.superAdminLayout = SuperAdminLayout;
