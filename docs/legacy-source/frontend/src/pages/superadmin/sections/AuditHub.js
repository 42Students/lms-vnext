import { Alert } from "antd";
import ActivityCenter from "@/components/admin/activity/ActivityCenter";

export default function AuditHub({ selectedOrganizationId, selectedCollegeId }) {
  const collegeScoped = selectedCollegeId != null;
  const orgScoped = !collegeScoped && selectedOrganizationId != null;

  return (
    <div className="admin-activity-hub">
      {(collegeScoped || orgScoped) && (
        <Alert
          type="info"
          showIcon
          message={collegeScoped ? "Showing this college" : "Showing this organization"}
          description={
            collegeScoped
              ? "Activity is pinned to the selected college. Change the header scope to inspect another college, or clear it for platform-wide activity."
              : "Activity is pinned to the selected organization. Choose a college for a narrower operational view, or clear scope for platform-wide activity."
          }
          style={{ marginBottom: 16 }}
        />
      )}
      {!collegeScoped && !orgScoped && (
        <Alert
          type="info"
          showIcon
          message="Platform-wide activity"
          description="Important changes across all organizations and colleges are shown first. Use the header scope when you need to investigate one tenant."
          style={{ marginBottom: 16 }}
        />
      )}
      <ActivityCenter
        organizationId={selectedOrganizationId}
        collegeId={selectedCollegeId}
      />
    </div>
  );
}
