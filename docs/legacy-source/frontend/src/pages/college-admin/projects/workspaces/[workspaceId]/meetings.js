import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Form, Skeleton, message } from "antd";
import AdminLayout from "@/layouts/AdminLayout";
import AdminWorkspaceShell from "@/components/admin/AdminWorkspaceShell";
import { appAction } from "@/redux/store";
import { showProjectError } from "@/utils/projectErrorModal";
import { updateProject } from "@/api/Services/AdminService";
import { aliasSectionRowKeys, dealiasSectionRowKeys, normaliseCollegeScopedName, toStructuredValue } from "@/components/admin/projects/adminProjectUtils";
import WorkspaceMeetingsEditor from "@/components/admin/projects/WorkspaceMeetingsEditor";
import { useUnsavedFormGuard } from "@/components/admin/projects/useUnsavedFormGuard";
import { refreshWorkspaceForSave, useAdminWorkspace } from "@/components/admin/projects/adminWorkspaceSection";
import { withoutKey,
  MEETING_FIELDS,
  sprintSelectOptions,
  taskSelectOptions,
  materializeSectionKeys,
} from "@/components/admin/projects/projectSectionFieldConfigs";

export default function AdminProjectWorkspaceMeetingsPage() {
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
    form.setFieldsValue({ meetingsList: aliasSectionRowKeys("meetingsList", toStructuredValue(item?.meetingsList, [])) });
  });
  const sprintRows = useMemo(() => aliasSectionRowKeys("sprints", toStructuredValue(workspace?.sprints, [])), [workspace]);
  const taskRows = useMemo(() => aliasSectionRowKeys("tasks", toStructuredValue(workspace?.tasks, [])), [workspace]);
  const [submitting, setSubmitting] = useState(false);
  useUnsavedFormGuard(form, { enabled: Boolean(workspace) });

  // Sprints and tasks are read-only context here (each is edited on its own tab) — they exist so
  // a meeting's "Linked sprint"/"Linked task" dropdowns offer the workspace's real keys.
  const sprintOptions = useMemo(() => sprintSelectOptions(sprintRows), [sprintRows]);
  const taskOptions = useMemo(() => taskSelectOptions(taskRows), [taskRows]);

  useEffect(() => {
    dispatch(appAction.setActiveMenuItem("projects"));
  }, [dispatch]);

  const handleSubmit = async (values) => {
    // The editor is pre-filled with the load-time snapshot (it's never blank for existing
    // content), so saving an untouched section would resend it verbatim — clobbering any edit
    // made elsewhere between page load and this save. The backend
    // (ProjectWorkspaceUpdateDTO) already treats an omitted field as "leave unchanged".
    if (!form.isFieldTouched("meetingsList")) {
      message.info("No changes to save");
      return;
    }
    setSubmitting(true);
    try {
      // Sprints/tasks go in as context so a meeting's linkedSprintKey/linkedTaskKey still resolves
      // against their real keys — only the meetings half of the result is sent.
      // Fresh siblings, not the page-load snapshot — see refreshWorkspaceForSave.
      const fresh = await refreshWorkspaceForSave(workspaceId, collegeId, workspace);
      const rowsOf = (name) => aliasSectionRowKeys(name, toStructuredValue(fresh?.[name], []));
      const materialized = materializeSectionKeys(
        rowsOf("sprints"),
        rowsOf("tasks"),
        rowsOf("resources"),
        values.meetingsList ?? []
      );
      // "meetingsList" matches ProjectWorkspaceUpdateDTO.meetingsList exactly. Only this section
      // is sent — every omitted field means "leave unchanged" — so a meeting edit here can no
      // longer clobber a sprint/task/resource edit made elsewhere since this page loaded.
      await updateProject(workspaceId, collegeId, {
        meetingsList: dealiasSectionRowKeys("meetingsList", materialized.meetings),
        // Token from the copy this editor loaded (Projects audit R3-02).
        meetingsToken: workspace?.meetingsToken,
      });
      message.success("Meetings updated");
      // Deliberately no `form.resetFields()` here. It resets to the (empty) initialValues, so it
      // blanked the editor for the whole refetch — and left it blank if the refetch failed, right
      // after a "saved" toast. The re-seed effect/callback below resets and refills in one
      // synchronous step instead, which also clears touched state so the untouched-save guard
      // arms again.
      await load();
    } catch (e) {
      showProjectError(e, { fallback: "Failed to update meetings" });
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
        subtitle="Plan project touchpoints and connect conversations to the work they support."
      >
        {error ? (
          <Alert type="error" message="Workspace could not be loaded" description={error} showIcon style={{ marginBottom: 16 }} action={<Button size="small" onClick={load}>Retry</Button>} />
        ) : null}

        <Skeleton loading={loading} active paragraph={{ rows: 6 }}>
          {workspace ? (
            <WorkspaceMeetingsEditor
              form={form}
              fields={withoutKey(MEETING_FIELDS)}
              sprintOptions={sprintOptions}
              taskOptions={taskOptions}
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

AdminProjectWorkspaceMeetingsPage.adminLayout = AdminLayout;
