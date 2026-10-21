import { useRouter } from "next/router";
import { Alert, Button, Skeleton } from "antd";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminWorkspaceShell from "@/components/admin/SuperAdminWorkspaceShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";
import { normaliseCollegeScopedName } from "@/components/admin/projects/adminProjectUtils";
import WorkspaceDeliveryOverview from "@/components/admin/projects/WorkspaceDeliveryOverview";
import { useSuperAdminWorkspace } from "@/components/admin/projects/superAdminWorkspaceSection";

export default function SuperAdminWorkspaceDeliveryPage() {
  const router = useRouter();
  const { selectedCollegeId: collegeId, scopeLoaded } = useSuperAdminScope();
  const workspaceId = router.query.workspaceId;

  const { workspace, loading, error, reload } = useSuperAdminWorkspace(workspaceId, collegeId);

  if (!collegeId) {
    return (
      <div className="ln-module admin-list-page">
        {/* Inside the shell: a missing scope is a state to recover from, and dropping the tab
            strip and every other navigation affordance is the one thing that makes it harder. */}
        <SuperAdminWorkspaceShell workspaceId={workspaceId} title="Workspace">
          {scopeLoaded ? (
            <Alert
              type="warning"
              message="No college selected"
              description="Pick a college in the header to work with its project workspaces."
              showIcon
            />
          ) : (
            <Skeleton active paragraph={{ rows: 4 }} />
          )}
        </SuperAdminWorkspaceShell>
      </div>
    );
  }

  return (
    <div className="ln-module admin-list-page">
      <SuperAdminWorkspaceShell
        workspaceId={workspaceId}
        title={workspace ? normaliseCollegeScopedName(workspace, "Workspace") : "Workspace"}
        subtitle="Review the final submission package, evidence, revisions and mentor feedback."
      >
        {error ? (
          <Alert type="error" message="Workspace could not be loaded" description={error} showIcon style={{ marginBottom: 16 }} action={<Button size="small" onClick={reload}>Retry</Button>} />
        ) : null}

        <Skeleton loading={loading} active paragraph={{ rows: 6 }}>
          {workspace ? (
            <WorkspaceDeliveryOverview workspace={workspace} />
          ) : (
            !loading && <Alert type="warning" message="Workspace not found" showIcon />
          )}
        </Skeleton>
      </SuperAdminWorkspaceShell>
    </div>
  );
}

SuperAdminWorkspaceDeliveryPage.superAdminLayout = SuperAdminLayout;
