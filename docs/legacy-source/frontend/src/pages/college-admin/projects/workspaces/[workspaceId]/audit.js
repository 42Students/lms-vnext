import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button } from "antd";
import { AuditOutlined } from "@ant-design/icons";
import AdminLayout from "@/layouts/AdminLayout";
import AdminWorkspaceShell from "@/components/admin/AdminWorkspaceShell";
import { appAction } from "@/redux/store";
import { fetchWithErrorHandling, getProjectResourceAudit } from "@/api/Services/AdminService";
import { asArray, normaliseCollegeScopedName } from "@/components/admin/projects/adminProjectUtils";
import WorkspaceResourceAudit from "@/components/admin/projects/WorkspaceResourceAudit";
import { useAdminWorkspace } from "@/components/admin/projects/adminWorkspaceSection";

export default function AdminProjectWorkspaceAuditPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const loginUser = useSelector((state) => state.loginUser);
  const collegeId = loginUser?.collegeId ?? null;
  const workspaceId = router.query.workspaceId;

  const { workspace, loading: workspaceLoading, error: workspaceError, reload: reloadWorkspace } = useAdminWorkspace(workspaceId, collegeId);
  const [resourceAudit, setResourceAudit] = useState([]);
  const [resourceAuditLoading, setResourceAuditLoading] = useState(false);
  const [resourceAuditError, setResourceAuditError] = useState(null);
  const [resourceAuditReloadKey, setResourceAuditReloadKey] = useState(0);

  useEffect(() => {
    dispatch(appAction.setActiveMenuItem("projects"));
  }, [dispatch]);

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
        {/* Inside the shell: a missing college is a state to recover from, and dropping the
            tab strip and every other navigation affordance is the one thing that makes it
            harder. */}
        <AdminWorkspaceShell workspaceId={workspaceId} title="Project workspace">
          <Alert
            type="warning"
            message="Admin not assigned to a college"
            description="You must be assigned to a college to view project workspaces."
            showIcon
          />
        </AdminWorkspaceShell>
      </div>
    );
  }

  return (
    <div className="ln-module admin-list-page">
      <AdminWorkspaceShell
        workspaceId={workspaceId}
        title={workspace ? normaliseCollegeScopedName(workspace, "Workspace") : "Project workspace"}
        subtitle="Trace resource changes here, or open the full project audit trail for broader events."
        actions={
          workspaceId ? (
            // The DTO's identifier (workspaceId here) IS the slug — there is no separate
            // `workspace.slug` field on ProjectWorkspaceDTO.
            <Button
              icon={<AuditOutlined />}
              onClick={() => router.push(`/college-admin/projects/audit?entityId=${encodeURIComponent(workspaceId)}&range=all`)}
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
            description="Audit history is still available below, but the workspace title/status may be stale or unavailable."
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
      </AdminWorkspaceShell>
    </div>
  );
}

AdminProjectWorkspaceAuditPage.adminLayout = AdminLayout;
