import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Button, Form, Skeleton, message } from "antd";
import { showProjectError } from "@/utils/projectErrorModal";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminWorkspaceShell from "@/components/admin/SuperAdminWorkspaceShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";
import { updateProject } from "@/api/Services/AdminService";
import { normaliseCollegeScopedName, toStructuredValue } from "@/components/admin/projects/adminProjectUtils";
import { useUnsavedFormGuard } from "@/components/admin/projects/useUnsavedFormGuard";
import WorkspaceOverviewEditor from "@/components/admin/projects/WorkspaceOverviewEditor";
import { useSuperAdminWorkspace } from "@/components/admin/projects/superAdminWorkspaceSection";

const toLines = (text) =>
  String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

/**
 * The project's narrative content — what mentors and students actually read on their own Overview
 * tab: the goal, the deliverables checklist, the definition of done and the personas.
 *
 * This used to live at the bottom of Summary, under a "Content" heading, purely because no tab
 * covered it. That made Summary carry two unrelated jobs (workspace metadata *and* project
 * content) in 760 lines, and had a concrete side effect: the deliverables validator below is
 * attached to the same Form as the title and status fields, so a workspace with no deliverables
 * yet could not have its title corrected — saving failed on a field the person editing had never
 * looked at. Splitting the form splits the validation with it.
 */
export default function SuperAdminWorkspaceOverviewPage() {
  const router = useRouter();
  const { selectedCollegeId: collegeId, scopeLoaded } = useSuperAdminScope();
  const workspaceId = router.query.workspaceId;
  const [form] = Form.useForm();

  const { workspace, loading, error, reload } = useSuperAdminWorkspace(workspaceId, collegeId);
  const [submitting, setSubmitting] = useState(false);
  useUnsavedFormGuard(form, { enabled: Boolean(workspace) });

  // Any key of project.overview this form does not edit. overview is seeded as a full copy of the
  // template's overview when a workspace is created, so it can hold keys no admin form knows
  // about; they are read back here and re-sent verbatim so a save never drops them.
  const overviewFactsRef = useRef({});

  useEffect(() => {
    if (!workspace) return;
    const overviewValue = toStructuredValue(workspace?.overview, {});
    const {
      goal: overviewGoal,
      deliverables: overviewDeliverables,
      definitionOfDone: overviewDoD,
      personas: overviewPersonas,
      ...overviewFacts
    } = overviewValue || {};
    overviewFactsRef.current = overviewFacts;
    // resetFields() first, then refill: this clears touched state (so the untouched-save guard
    // arms again after a save) and repopulates in the same synchronous step, so the editor is
    // never observably blank.
    form.resetFields();
    form.setFieldsValue({
      overviewGoal: overviewGoal || "",
      overviewDeliverablesText: Array.isArray(overviewDeliverables) ? overviewDeliverables.join("\n") : "",
      overviewDoDText: Array.isArray(overviewDoD) ? overviewDoD.join("\n") : "",
      overviewPersonasText: Array.isArray(overviewPersonas) ? overviewPersonas.join("\n") : "",
    });
  }, [workspace, form]);

  const handleSubmit = async (values) => {
    // The editor is pre-filled with the load-time snapshot, so saving an untouched section would
    // resend it verbatim, clobbering an edit made elsewhere since this page loaded.
    if (!form.isFieldsTouched()) {
      message.info("No changes to save");
      return;
    }
    setSubmitting(true);
    try {
      await updateProject(workspaceId, collegeId, {
        // Details token from the copy this page loaded: a newer edit by someone else is a 409, not overwritten (R3-03).
        detailsToken: workspace?.detailsToken,
        overview: {
          ...overviewFactsRef.current,
          // All four are sent unconditionally, so emptying a field actually clears it. Goal and
          // deliverables used to be conditionally spread — they could be written but never
          // removed, because an emptied field simply vanished from the payload.
          //
          // The arrays already worked, because mergeProjectMaps overwrites with an empty array.
          // `goal` is a string, and that merge used to skip blank strings on both its read and
          // write paths; it now keys off whether a field is *present* rather than whether it is
          // empty, so a blank sent from here is stored and then wins over the template's value on
          // read instead of being inherited straight back.
          goal: values.overviewGoal || "",
          deliverables: toLines(values.overviewDeliverablesText),
          definitionOfDone: toLines(values.overviewDoDText),
          personas: toLines(values.overviewPersonasText),
        },
      });
      message.success("Overview updated");
      reload();
    } catch (e) {
      showProjectError(e, { fallback: "Failed to update overview" });
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
        subtitle="Shape the project brief mentors and students use to understand the work."
      >
        {error ? (
          <Alert type="error" message="Workspace could not be loaded" description={error} showIcon style={{ marginBottom: 16 }} action={<Button size="small" onClick={reload}>Retry</Button>} />
        ) : null}

        <Skeleton loading={loading} active paragraph={{ rows: 6 }}>
          {workspace ? (
            <WorkspaceOverviewEditor form={form} onFinish={handleSubmit} submitting={submitting} />
          ) : (
            !loading && <Alert type="warning" message="Workspace not found" showIcon />
          )}
        </Skeleton>
      </SuperAdminWorkspaceShell>
    </div>
  );
}

SuperAdminWorkspaceOverviewPage.superAdminLayout = SuperAdminLayout;
