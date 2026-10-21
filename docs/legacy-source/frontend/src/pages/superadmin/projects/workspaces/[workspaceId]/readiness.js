import { useMemo } from "react";
import { useRouter } from "next/router";
import { Alert, Button, Skeleton } from "antd";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminWorkspaceShell from "@/components/admin/SuperAdminWorkspaceShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";
import { normaliseCollegeScopedName } from "@/components/admin/projects/adminProjectUtils";
import WorkspaceReadinessOverview from "@/components/admin/projects/WorkspaceReadinessOverview";
import { useSuperAdminWorkspace } from "@/components/admin/projects/superAdminWorkspaceSection";

export default function SuperAdminWorkspaceReadinessPage() {
  const router = useRouter();
  const { selectedCollegeId: collegeId, scopeLoaded } = useSuperAdminScope();
  const workspaceId = router.query.workspaceId;

  const { workspace, loading, error, reload } = useSuperAdminWorkspace(workspaceId, collegeId);

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

  // ProjectWorkspaceDTO carries an embedded "readiness" object (populated by the shared toDto
  // path that getProjectByIdForCollege uses), so the workspace load above already has this —
  // no separate fetch needed.
  const readiness = workspace?.readiness ?? null;

  return (
    <div className="ln-module admin-list-page">
      <SuperAdminWorkspaceShell
        workspaceId={workspaceId}
        title={workspace ? normaliseCollegeScopedName(workspace, "Workspace") : "Workspace"}
        subtitle="Understand submission readiness, proof coverage and any manual override at a glance."
        actions={
          // An override-active state used to be signaled by switching the button itself to
          // type="primary" — button emphasis is a call-to-action signal, not a state indicator.
          // The "Override" row below already shows the real Tag-based indicator, so this stays plain.
          <Button onClick={() => router.push(`/superadmin/projects/readiness?projectId=${encodeURIComponent(workspaceId || "")}`)}>
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
      </SuperAdminWorkspaceShell>
    </div>
  );
}

SuperAdminWorkspaceReadinessPage.superAdminLayout = SuperAdminLayout;
