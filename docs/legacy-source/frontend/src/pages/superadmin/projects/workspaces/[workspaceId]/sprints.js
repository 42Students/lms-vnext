import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Button, Form, Skeleton, message } from "antd";
import { showProjectError } from "@/utils/projectErrorModal";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminWorkspaceShell from "@/components/admin/SuperAdminWorkspaceShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";
import { updateProject, getProjectReleases, fetchWithErrorHandling } from "@/api/Services/AdminService";
import { normaliseCollegeScopedName, unwrapApiList } from "@/components/admin/projects/adminProjectUtils";
import WorkspaceSprintsEditor from "@/components/admin/projects/WorkspaceSprintsEditor";
import { useUnsavedFormGuard } from "@/components/admin/projects/useUnsavedFormGuard";
import { WORKSPACE_SPRINT_FIELDS, stampSprintClientIds, withoutKey } from "@/components/admin/projects/projectSectionFieldConfigs";
import {
  materializeSectionRows,
  sectionRowsFromWorkspace,
  useSuperAdminWorkspace,
} from "@/components/admin/projects/superAdminWorkspaceSection";

export default function SuperAdminWorkspaceSprintsPage() {
  const router = useRouter();
  const { selectedCollegeId: collegeId, scopeLoaded } = useSuperAdminScope();
  const workspaceId = router.query.workspaceId;
  const [form] = Form.useForm();

  const { workspace, loading, error, reload } = useSuperAdminWorkspace(workspaceId, collegeId);
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
    if (!workspace) return;
    // resetFields() first, then refill: this clears touched state (so the untouched-save guard
    // arms again after a save) and repopulates in the same synchronous step, so the editor is
    // never observably blank.
    form.resetFields();
    form.setFieldsValue({ sprints: sectionRowsFromWorkspace("sprints", workspace) });
  }, [workspace, form]);

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
      await updateProject(workspaceId, collegeId, {
        sprints: materializeSectionRows("sprints", values.sprints ?? [], workspace),
        // Token from the copy this editor loaded (Projects audit R3-02).
        sprintsToken: workspace?.sprintsToken,
      });
      message.success("Sprints updated");
      // Deliberately no `form.resetFields()` here. It resets to the (empty) initialValues, so it
      // blanked the editor for the whole refetch — and left it blank if the refetch failed, right
      // after a "saved" toast. The re-seed effect/callback below resets and refills in one
      // synchronous step instead, which also clears touched state so the untouched-save guard
      // arms again.
      reload();
    } catch (e) {
      showProjectError(e, { fallback: "Failed to update sprints" });
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
        subtitle="Plan sprint outcomes, release alignment and delivery cadence for this workspace."
      >
        {error ? (
          <Alert type="error" message="Workspace could not be loaded" description={error} showIcon style={{ marginBottom: 16 }} action={<Button size="small" onClick={reload}>Retry</Button>} />
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
      </SuperAdminWorkspaceShell>
    </div>
  );
}

SuperAdminWorkspaceSprintsPage.superAdminLayout = SuperAdminLayout;
