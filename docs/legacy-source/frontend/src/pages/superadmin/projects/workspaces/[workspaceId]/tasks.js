import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Button, Form, Skeleton, message } from "antd";
import { showProjectError } from "@/utils/projectErrorModal";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminWorkspaceShell from "@/components/admin/SuperAdminWorkspaceShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";
import { updateProject } from "@/api/Services/AdminService";
import {
  normaliseCollegeScopedName,
} from "@/components/admin/projects/adminProjectUtils";
import WorkspaceTasksEditor from "@/components/admin/projects/WorkspaceTasksEditor";
import { useUnsavedFormGuard } from "@/components/admin/projects/useUnsavedFormGuard";
import { TASK_FIELDS, sprintSelectOptions, withoutKey } from "@/components/admin/projects/projectSectionFieldConfigs";
import {
  materializeSectionRows,
  sectionRowsFromWorkspace,
  useSuperAdminWorkspace,
  refreshWorkspaceForSave,
} from "@/components/admin/projects/superAdminWorkspaceSection";

export default function SuperAdminWorkspaceTasksPage() {
  const router = useRouter();
  const { selectedCollegeId: collegeId, scopeLoaded } = useSuperAdminScope();
  const workspaceId = router.query.workspaceId;
  const [form] = Form.useForm();

  const { workspace, loading, error, reload } = useSuperAdminWorkspace(workspaceId, collegeId);
  const [submitting, setSubmitting] = useState(false);
  useUnsavedFormGuard(form, { enabled: Boolean(workspace) });

  // Sprints are edited on their own section page — here they are only the source of the "Sprint"
  // dropdown each task links through, read straight off the loaded workspace.
  const sprints = useMemo(() => (workspace ? sectionRowsFromWorkspace("sprints", workspace) : []), [workspace]);
  const sprintOptions = useMemo(() => sprintSelectOptions(sprints), [sprints]);

  useEffect(() => {
    if (!workspace) return;
    // resetFields() first, then refill: this clears touched state (so the untouched-save guard
    // arms again after a save) and repopulates in the same synchronous step, so the editor is
    // never observably blank.
    form.resetFields();
    form.setFieldsValue({ tasks: sectionRowsFromWorkspace("tasks", workspace) });
  }, [workspace, form]);

  const handleSubmit = async (values) => {
    // The editor is pre-filled with the load-time snapshot (it's never blank for existing
    // content), so saving an untouched section would resend it verbatim — clobbering any edit
    // made elsewhere between page load and this save. The backend
    // (ProjectWorkspaceUpdateDTO) already treats an omitted field as "leave unchanged".
    if (!form.isFieldTouched("tasks")) {
      message.info("No changes to save");
      return;
    }
    setSubmitting(true);
    try {
      // Fresh siblings, not the page-load snapshot — see refreshWorkspaceForSave.
      const fresh = await refreshWorkspaceForSave(workspaceId, collegeId, workspace);
      await updateProject(workspaceId, collegeId, {
        tasks: materializeSectionRows("tasks", values.tasks ?? [], fresh),
        // Token from the copy this editor loaded (Projects audit R3-02).
        tasksToken: workspace?.tasksToken,
      });
      message.success("Tasks updated");
      // Deliberately no `form.resetFields()` here. It resets to the (empty) initialValues, so it
      // blanked the editor for the whole refetch — and left it blank if the refetch failed, right
      // after a "saved" toast. The re-seed effect/callback below resets and refills in one
      // synchronous step instead, which also clears touched state so the untouched-save guard
      // arms again.
      reload();
    } catch (e) {
      showProjectError(e, { fallback: "Failed to update tasks" });
    } finally {
      setSubmitting(false);
    }
  };

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
        subtitle="Shape the work breakdown and review learner submission activity for this workspace."
      >
        {error ? (
          <Alert type="error" message="Workspace could not be loaded" description={error} showIcon style={{ marginBottom: 16 }}
            action={<Button size="small" onClick={reload}>Retry</Button>} />
        ) : null}

        <Skeleton loading={loading} active paragraph={{ rows: 6 }}>
          {workspace ? (
            <WorkspaceTasksEditor
              form={form}
              workspace={workspace}
              workspaceId={workspaceId}
              basePath="/superadmin"
              sprintRows={sprints}
              sprintOptions={sprintOptions}
              fields={withoutKey(TASK_FIELDS)}
              onFinish={handleSubmit}
              submitting={submitting}
            />
          ) : (
            !loading && <Alert type="warning" message="Workspace not found" showIcon />
          )}
        </Skeleton>
      </SuperAdminWorkspaceShell>
    </div>
  );
}

SuperAdminWorkspaceTasksPage.superAdminLayout = SuperAdminLayout;
