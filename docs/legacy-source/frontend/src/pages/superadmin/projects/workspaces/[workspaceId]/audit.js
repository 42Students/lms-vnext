import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Button, Skeleton } from "antd";
import { AuditOutlined } from "@ant-design/icons";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminWorkspaceShell from "@/components/admin/SuperAdminWorkspaceShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";
import { fetchWithErrorHandling, getProjectResourceAudit } from "@/api/Services/AdminService";
import { asArray, normaliseCollegeScopedName } from "@/components/admin/projects/adminProjectUtils";
import WorkspaceResourceAudit from "@/components/admin/projects/WorkspaceResourceAudit";
import { useSuperAdminWorkspace } from "@/components/admin/projects/superAdminWorkspaceSection";

export default function SuperAdminWorkspaceAuditPage() {
  const router = useRouter();
  const { selectedCollegeId: collegeId, scopeLoaded } = useSuperAdminScope();
  const workspaceId = router.query.workspaceId;

  const { workspace, loading: workspaceLoading, error: workspaceError, reload: reloadWorkspace } = useSuperAdminWorkspace(workspaceId, collegeId);

  const [resourceAudit, setResourceAudit] = useState([]);
  const [resourceAuditLoading, setResourceAuditLoading] = useState(false);
  const [resourceAuditError, setResourceAuditError] = useState(null);
  const [resourceAuditReloadKey, setResourceAuditReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    const loadResourceAudit = async () => {
      if (!workspaceId || !collegeId) return;
      setResourceAuditLoading(true);
      setResourceAuditError(null);
      const result = await fetchWithErrorHandling(getProjectResourceAudit(workspaceId, collegeId));
      if (!mounted) return;
      if (result.success) {
        setResourceAudit(asArray(result?.data?.data ?? result?.data ?? []));
      } else {
        setResourceAudit([]);
        setResourceAuditError(result?.message || "Failed to load resource audit history.");
      }
      setResourceAuditLoading(false);
    };
    loadResourceAudit();
    return () => {
      mounted = false;
    };
  }, [workspaceId, collegeId, resourceAuditReloadKey]);

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
        subtitle="Trace resource changes here, or open the full project audit trail for broader events."
        actions={
          workspaceId ? (
            // The DTO's identifier (workspaceId here) IS the slug — there is no separate
            // `workspace.slug` field on ProjectWorkspaceDTO.
            <Button
              icon={<AuditOutlined />}
              onClick={() => router.push(`/superadmin/projects/audit?entityId=${encodeURIComponent(workspaceId)}&range=all`)}
            >
              View audit trail
            </Button>
          ) : null
        }
      >
        {workspaceError ? (
          <Alert
            type="warning"
            showIcon
            message="Workspace summary could not be loaded"
            description="Resource history is still available below, but the workspace title may be unavailable."
            style={{ marginBottom: 16 }}
            action={<Button size="small" onClick={reloadWorkspace} loading={workspaceLoading}>Retry workspace</Button>}
          />
        ) : null}

        <WorkspaceResourceAudit
          items={resourceAudit}
          loading={resourceAuditLoading}
          error={resourceAuditError}
          onRetry={() => setResourceAuditReloadKey((value) => value + 1)}
        />
      </SuperAdminWorkspaceShell>
    </div>
  );
}

SuperAdminWorkspaceAuditPage.superAdminLayout = SuperAdminLayout;
