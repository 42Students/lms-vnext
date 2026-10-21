import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Button, Form, Skeleton, message } from "antd";
import { showProjectError } from "@/utils/projectErrorModal";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminWorkspaceShell from "@/components/admin/SuperAdminWorkspaceShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";
import { updateProject } from "@/api/Services/AdminService";
import { normaliseCollegeScopedName } from "@/components/admin/projects/adminProjectUtils";
import WorkspaceResourcesEditor from "@/components/admin/projects/WorkspaceResourcesEditor";
import { useUnsavedFormGuard } from "@/components/admin/projects/useUnsavedFormGuard";
import { RESOURCE_FIELDS, withoutKey } from "@/components/admin/projects/projectSectionFieldConfigs";
import {
  materializeSectionRows,
  sectionRowsFromWorkspace,
  useSuperAdminWorkspace,
} from "@/components/admin/projects/superAdminWorkspaceSection";

export default function SuperAdminWorkspaceResourcesPage() {
  const router = useRouter();
  const { selectedCollegeId: collegeId, scopeLoaded } = useSuperAdminScope();
  const workspaceId = router.query.workspaceId;
  const [form] = Form.useForm();

  const { workspace, loading, error, reload } = useSuperAdminWorkspace(workspaceId, collegeId);
  const [submitting, setSubmitting] = useState(false);
  useUnsavedFormGuard(form, { enabled: Boolean(workspace) });

  useEffect(() => {
    if (!workspace) return;
    // resetFields() first, then refill: this clears touched state (so the untouched-save guard
    // arms again after a save) and repopulates in the same synchronous step, so the editor is
    // never observably blank.
    form.resetFields();
    form.setFieldsValue({ resources: sectionRowsFromWorkspace("resources", workspace) });
  }, [workspace, form]);

  const handleSubmit = async (values) => {
    // The editor is pre-filled with the load-time snapshot (it's never blank for existing
    // content), so saving an untouched section would resend it verbatim — clobbering any edit
    // made elsewhere between page load and this save. The backend
    // (ProjectWorkspaceUpdateDTO) already treats an omitted field as "leave unchanged".
    if (!form.isFieldTouched("resources")) {
      message.info("No changes to save");
      return;
    }
    setSubmitting(true);
    try {
      await updateProject(workspaceId, collegeId, {
        resources: materializeSectionRows("resources", values.resources ?? [], workspace),
        // Token from the copy this editor loaded (Projects audit R3-02).
        resourcesToken: workspace?.resourcesToken,
      });
      message.success("Resources updated");
      // Deliberately no `form.resetFields()` here. It resets to the (empty) initialValues, so it
      // blanked the editor for the whole refetch — and left it blank if the refetch failed, right
      // after a "saved" toast. The re-seed effect/callback below resets and refills in one
      // synchronous step instead, which also clears touched state so the untouched-save guard
      // arms again.
      reload();
    } catch (e) {
      showProjectError(e, { fallback: "Failed to update resources" });
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
        subtitle="Curate the references, files and access guidance this workspace team needs."
      >
        {error ? (
          <Alert type="error" message="Workspace could not be loaded" description={error} showIcon style={{ marginBottom: 16 }} action={<Button size="small" onClick={reload}>Retry</Button>} />
        ) : null}

        <Skeleton loading={loading} active paragraph={{ rows: 6 }}>
          {workspace ? (
            <WorkspaceResourcesEditor
              form={form}
              fields={withoutKey(RESOURCE_FIELDS)}
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

SuperAdminWorkspaceResourcesPage.superAdminLayout = SuperAdminLayout;
