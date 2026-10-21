import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Form, Skeleton, message } from "antd";
import AdminLayout from "@/layouts/AdminLayout";
import AdminWorkspaceShell from "@/components/admin/AdminWorkspaceShell";
import { appAction } from "@/redux/store";
import { showProjectError } from "@/utils/projectErrorModal";
import { updateProject } from "@/api/Services/AdminService";
import {
  aliasSectionRowKeys,
  dealiasSectionRowKeys,
  normaliseCollegeScopedName,
  toStructuredValue,
} from "@/components/admin/projects/adminProjectUtils";
import WorkspaceTasksEditor from "@/components/admin/projects/WorkspaceTasksEditor";
import { useUnsavedFormGuard } from "@/components/admin/projects/useUnsavedFormGuard";
import { refreshWorkspaceForSave, useAdminWorkspace } from "@/components/admin/projects/adminWorkspaceSection";
import { withoutKey,
  TASK_FIELDS,
  sprintSelectOptions,
  materializeSectionKeys,
} from "@/components/admin/projects/projectSectionFieldConfigs";

export default function AdminProjectWorkspaceTasksPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const loginUser = useSelector((state) => state.loginUser);
  const collegeId = loginUser?.collegeId ?? null;
  const workspaceId = router.query.workspaceId;
  const [form] = Form.useForm();

  const { workspace, loading, error, reload: load } = useAdminWorkspace(workspaceId, collegeId, (item) => {
    // resetFields() first, then refill: this clears touched state (so the untouched-save guard
    // arms again after a save) and repopulates in the same synchronous step, so the editor is
    // never observably blank.
    form.resetFields();
    form.setFieldsValue({ tasks: aliasSectionRowKeys("tasks", toStructuredValue(item?.tasks, [])) });
  });
  const sprintRows = useMemo(() => aliasSectionRowKeys("sprints", toStructuredValue(workspace?.sprints, [])), [workspace]);
  const [submitting, setSubmitting] = useState(false);
  useUnsavedFormGuard(form, { enabled: Boolean(workspace) });

  // Sprints are read-only context on this page (they are edited on the Sprints tab) — they exist
  // here only so each task's "Sprint" dropdown can offer the workspace's real sprint keys.
  const sprintOptions = useMemo(() => sprintSelectOptions(sprintRows), [sprintRows]);

  useEffect(() => {
    dispatch(appAction.setActiveMenuItem("projects"));
  }, [dispatch]);

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
      // The workspace's own sprints go in as context so a task pointing at one still resolves
      // against its real key — only the tasks half of the result is sent.
      // Fresh siblings, not the page-load snapshot — see refreshWorkspaceForSave.
      const fresh = await refreshWorkspaceForSave(workspaceId, collegeId, workspace);
      const rowsOf = (name) => aliasSectionRowKeys(name, toStructuredValue(fresh?.[name], []));
      const materialized = materializeSectionKeys(
        rowsOf("sprints"),
        values.tasks ?? [],
        rowsOf("resources"),
        rowsOf("meetingsList")
      );
      // Only this section is sent — ProjectWorkspaceUpdateDTO treats every omitted field as
      // "leave unchanged", so a task edit here can no longer clobber a sprint/resource/meeting
      // edit someone else made between this page's load and this save.
// The token from the copy this editor loaded: the server refuses the save if rows were added, changed or removed since
      // (Projects audit R3-02), instead of overwriting or deleting them.
      await updateProject(workspaceId, collegeId, { tasks: dealiasSectionRowKeys("tasks", materialized.tasks), tasksToken: workspace?.tasksToken });
      message.success("Tasks updated");
      // Deliberately no `form.resetFields()` here. It resets to the (empty) initialValues, so it
      // blanked the editor for the whole refetch — and left it blank if the refetch failed, right
      // after a "saved" toast. The re-seed effect/callback below resets and refills in one
      // synchronous step instead, which also clears touched state so the untouched-save guard
      // arms again.
      await load();
    } catch (e) {
      showProjectError(e, { fallback: "Failed to update tasks" });
    } finally {
      setSubmitting(false);
    }
  };

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
        subtitle="Shape the work breakdown and review learner submission activity for this workspace."
      >
        {error ? (
          <Alert type="error" message="Workspace could not be loaded" description={error} showIcon style={{ marginBottom: 16 }}
            action={<Button size="small" onClick={load}>Retry</Button>} />
        ) : null}

        <Skeleton loading={loading} active paragraph={{ rows: 6 }}>
          {workspace ? (
            <WorkspaceTasksEditor
              form={form}
              workspace={workspace}
              workspaceId={workspaceId}
              basePath="/college-admin"
              sprintRows={sprintRows}
              sprintOptions={sprintOptions}
              fields={withoutKey(TASK_FIELDS)}
              onFinish={handleSubmit}
              submitting={submitting}
            />
          ) : (
            !loading && <Alert type="warning" message="Workspace not found" showIcon />
          )}
        </Skeleton>
      </AdminWorkspaceShell>
    </div>
  );
}

AdminProjectWorkspaceTasksPage.adminLayout = AdminLayout;
