import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Form, Skeleton, message } from "antd";
import AdminLayout from "@/layouts/AdminLayout";
import AdminWorkspaceShell from "@/components/admin/AdminWorkspaceShell";
import { appAction } from "@/redux/store";
import { showProjectError } from "@/utils/projectErrorModal";
import { updateProject, getProjectReleases, fetchWithErrorHandling } from "@/api/Services/AdminService";
import { aliasSectionRowKeys, dealiasSectionRowKeys, normaliseCollegeScopedName, toStructuredValue, unwrapApiList } from "@/components/admin/projects/adminProjectUtils";
import WorkspaceSprintsEditor from "@/components/admin/projects/WorkspaceSprintsEditor";
import { useUnsavedFormGuard } from "@/components/admin/projects/useUnsavedFormGuard";
import { refreshWorkspaceForSave, useAdminWorkspace } from "@/components/admin/projects/adminWorkspaceSection";
import { withoutKey,
  WORKSPACE_SPRINT_FIELDS,
  materializeSectionKeys,
  stampSprintClientIds,
} from "@/components/admin/projects/projectSectionFieldConfigs";

export default function AdminProjectWorkspaceSprintsPage() {
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
    form.setFieldsValue({ sprints: aliasSectionRowKeys("sprints", toStructuredValue(item?.sprints, [])) });
  });
  const [submitting, setSubmitting] = useState(false);
  const sprints = Form.useWatch("sprints", form);
  useUnsavedFormGuard(form, { enabled: Boolean(workspace) });

  // V173: a sprint always ships in a release now, and unlike a template a workspace already has
  // real ProjectRelease rows (created by the mentor, or seeded from its template) — this page's
  // "Release" field picks from those, rather than a free-text key an admin could typo against
  // nothing (see WORKSPACE_SPRINT_FIELDS' own comment).
  const [releases, setReleases] = useState([]);
  const [releasesLoading, setReleasesLoading] = useState(false);
  const [releasesError, setReleasesError] = useState(null);
  const [releasesRetryKey, setReleasesRetryKey] = useState(0);
  useEffect(() => {
    if (!workspaceId || !collegeId) return;
    let cancelled = false;
    setReleasesLoading(true);
    setReleasesError(null);
    fetchWithErrorHandling(getProjectReleases(workspaceId, collegeId))
      .then((result) => {
        if (cancelled) return;
        if (result?.success) {
          setReleases(unwrapApiList(result));
        } else {
          setReleases([]);
          setReleasesError(result?.message || "Could not load project releases.");
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setReleases([]);
        setReleasesError(error?.message || "Could not load project releases.");
      })
      .finally(() => {
        if (!cancelled) setReleasesLoading(false);
      });
    return () => { cancelled = true; };
  }, [workspaceId, collegeId, releasesRetryKey]);
  const releaseOptions = releases.map((release) => ({ value: release.releaseKey, label: release.title }));

  useEffect(() => {
    dispatch(appAction.setActiveMenuItem("projects"));
  }, [dispatch]);

  // Stamp a stable _clientId onto any sprint row that doesn't have one yet (a freshly-added
  // row) before anything can link to it via the Sprint dropdown — see stampSprintClientIds.
  useEffect(() => {
    const stamped = stampSprintClientIds(sprints);
    if (stamped !== sprints) form.setFieldValue("sprints", stamped);
  }, [sprints, form]);

  const handleSubmit = async (values) => {
    // The editor is pre-filled with the load-time snapshot (it's never blank for existing
    // content), so saving an untouched section would resend it verbatim — clobbering any edit
    // made elsewhere between page load and this save. The backend
    // (ProjectWorkspaceUpdateDTO) already treats an omitted field as "leave unchanged".
    if (!form.isFieldTouched("sprints")) {
      message.info("No changes to save");
      return;
    }
    setSubmitting(true);
    try {
      // Fresh siblings, not the page-load snapshot — see refreshWorkspaceForSave.
      const fresh = await refreshWorkspaceForSave(workspaceId, collegeId, workspace);
      const rowsOf = (name) => aliasSectionRowKeys(name, toStructuredValue(fresh?.[name], []));
      const materialized = materializeSectionKeys(
        values.sprints ?? [],
        rowsOf("tasks"),
        rowsOf("resources"),
        rowsOf("meetingsList")
      );
      // Only this section is sent — ProjectWorkspaceUpdateDTO treats every omitted field as
      // "leave unchanged", so a sprint edit here can no longer clobber a task/resource/meeting
      // edit someone else made between this page's load and this save.
// The token from the copy this editor loaded: the server refuses the save if rows were added, changed or removed since
      // (Projects audit R3-02), instead of overwriting or deleting them.
      await updateProject(workspaceId, collegeId, { sprints: dealiasSectionRowKeys("sprints", materialized.sprints), sprintsToken: workspace?.sprintsToken });
      message.success("Sprints updated");
      // Deliberately no `form.resetFields()` here. It resets to the (empty) initialValues, so it
      // blanked the editor for the whole refetch — and left it blank if the refetch failed, right
      // after a "saved" toast. The re-seed effect/callback below resets and refills in one
      // synchronous step instead, which also clears touched state so the untouched-save guard
      // arms again.
      await load();
    } catch (e) {
      showProjectError(e, { fallback: "Failed to update sprints" });
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
        subtitle="Plan sprint outcomes, release alignment and delivery cadence for this workspace."
      >
        {error ? (
          <Alert type="error" message="Workspace could not be loaded" description={error} showIcon style={{ marginBottom: 16 }} action={<Button size="small" onClick={load}>Retry</Button>} />
        ) : null}

        <Skeleton loading={loading} active paragraph={{ rows: 6 }}>
          {workspace ? (
            <WorkspaceSprintsEditor
              form={form}
              workspace={workspace}
              sprints={sprints}
              fields={withoutKey(WORKSPACE_SPRINT_FIELDS)}
              releaseOptions={releaseOptions}
              releasesLoading={releasesLoading}
              releasesError={releasesError}
              onRetryReleases={() => setReleasesRetryKey((value) => value + 1)}
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

AdminProjectWorkspaceSprintsPage.adminLayout = AdminLayout;
