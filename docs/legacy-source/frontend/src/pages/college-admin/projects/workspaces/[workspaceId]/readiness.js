import { useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Skeleton } from "antd";
import AdminLayout from "@/layouts/AdminLayout";
import AdminWorkspaceShell from "@/components/admin/AdminWorkspaceShell";
import { appAction } from "@/redux/store";
import { normaliseCollegeScopedName } from "@/components/admin/projects/adminProjectUtils";
import WorkspaceReadinessOverview from "@/components/admin/projects/WorkspaceReadinessOverview";
import { useAdminWorkspace } from "@/components/admin/projects/adminWorkspaceSection";

export default function AdminProjectWorkspaceReadinessPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const loginUser = useSelector((state) => state.loginUser);
  const collegeId = loginUser?.collegeId ?? null;
  const workspaceId = router.query.workspaceId;

  const { workspace, loading, error, reload } = useAdminWorkspace(workspaceId, collegeId);

  useEffect(() => {
    dispatch(appAction.setActiveMenuItem("projects"));
  }, [dispatch]);

  // Gap fix: readiness already told an admin HOW MANY tasks are done, but nothing about whether
  // any of that completed work actually has proof attached -- the one thing per-task submission
  // was built to answer. Computed client-side from resolvedTasks (already on this same loaded
  // workspace) rather than a new backend field, since it's a simple derived count. Declared before
  // the early return below -- hooks must run in the same order on every render.
  const submissionCoverage = useMemo(() => {
    const tasks = Array.isArray(workspace?.resolvedTasks) ? workspace.resolvedTasks : [];
    const completed = tasks.filter((task) => String(task?.status || "").toUpperCase().includes("COMPLET") || String(task?.status || "").toUpperCase() === "DONE");
    const completedWithSubmission = completed.filter((task) => task?.submissionUrl);
    return { completed: completed.length, withSubmission: completedWithSubmission.length };
  }, [workspace]);

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

  // ProjectWorkspaceDTO carries an embedded "readiness" object (populated by the shared toDto
  // path that getProjectByIdForCollege uses), so the workspace load above already has this —
  // no separate fetch needed.
  const readiness = workspace?.readiness ?? null;

  return (
    <div className="ln-module admin-list-page">
      <AdminWorkspaceShell
        workspaceId={workspaceId}
        title={workspace ? normaliseCollegeScopedName(workspace, "Workspace") : "Project workspace"}
        subtitle="Understand submission readiness, proof coverage and any manual override at a glance."
        actions={
          <Button onClick={() => router.push(`/college-admin/projects/readiness?projectId=${encodeURIComponent(workspaceId || "")}`)}>
            Manage override
          </Button>
        }
      >
        {error ? (
          <Alert type="error" message="Workspace could not be loaded" description={error} showIcon style={{ marginBottom: 16 }} action={<Button size="small" onClick={reload}>Retry</Button>} />
        ) : null}

        <Skeleton loading={loading} active paragraph={{ rows: 6 }}>
          {workspace ? (
            <WorkspaceReadinessOverview workspace={workspace} readiness={readiness} submissionCoverage={submissionCoverage} />
          ) : (
            !loading && <Alert type="warning" message="Workspace not found" showIcon />
          )}
        </Skeleton>
      </AdminWorkspaceShell>
    </div>
  );
}

AdminProjectWorkspaceReadinessPage.adminLayout = AdminLayout;
