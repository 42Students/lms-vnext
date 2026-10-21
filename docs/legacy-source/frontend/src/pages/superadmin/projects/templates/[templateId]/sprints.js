import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Button, Card, Form, Skeleton, Typography, message } from "antd";
import { showProjectError } from "@/utils/projectErrorModal";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminTemplateShell from "@/components/admin/SuperAdminTemplateShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";
import { fetchWithErrorHandling, getProjectTemplateById, updateProjectTemplate } from "@/api/Services/AdminService";
import {
  normaliseCollegeScopedName,
  templateScalars,
  toArrayValue,
  unwrapApiItem,
} from "@/components/admin/projects/adminProjectUtils";
import RepeatingItemEditor, { validateRepeatingItems } from "@/components/admin/projects/RepeatingItemEditor";
import { useUnsavedFormGuard } from "@/components/admin/projects/useUnsavedFormGuard";
import {
  SPRINT_FIELDS,
  titleOfSprintOrTask,
  materializeSectionKeys,
  stampSprintClientIds,
} from "@/components/admin/projects/projectSectionFieldConfigs";

const { Paragraph } = Typography;

export default function SuperAdminProjectTemplateSprintsPage() {
  const router = useRouter();
  const { selectedCollegeId: collegeId } = useSuperAdminScope();
  const templateId = router.query.templateId;
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [template, setTemplate] = useState(null);

  const sprints = Form.useWatch("sprints", form);
  useUnsavedFormGuard(form, { enabled: Boolean(template) });

  // Stamp a stable _clientId onto any sprint row that doesn't have one yet (a freshly-added row,
  // or one loaded from data predating this convention) before a task can link to it by key.
  useEffect(() => {
    const stamped = stampSprintClientIds(sprints);
    if (stamped !== sprints) form.setFieldValue("sprints", stamped);
  }, [sprints, form]);

  const loadTemplate = useCallback(
    async (mountedRef) => {
      if (!templateId) return;
      setLoading(true);
      setError(null);
      try {
        const result = await fetchWithErrorHandling(getProjectTemplateById(templateId, collegeId));
        if (mountedRef && !mountedRef.current) return;
        if (result.success) {
          const item = unwrapApiItem(result);
          setTemplate(item);
          form.setFieldsValue({ sprints: toArrayValue(item?.sprints) });
        } else {
          setTemplate(null);
          setError(result?.message || "Failed to load template.");
        }
      } catch (e) {
        if (mountedRef && !mountedRef.current) return;
        setTemplate(null);
        setError(e?.message || "Failed to load template.");
      } finally {
        if (!mountedRef || mountedRef.current) setLoading(false);
      }
    },
    [templateId, collegeId, form]
  );

  useEffect(() => {
    const mountedRef = { current: true };
    loadTemplate(mountedRef);
    return () => {
      mountedRef.current = false;
    };
  }, [loadTemplate]);

  const handleSubmit = async (values) => {
    if (saving) return;
    setSaving(true);
    try {
      // Only `sprints` is taken from the result — passing the stored tasks/resources in would be a
      // cross-section edit, and the backend keeps whatever the payload omits.
      const { sprints: materializedSprints } = materializeSectionKeys(values.sprints, [], []);
      // Deleting a sprint used to also clean up any task pointing at it, because the old single
      // form submitted sprints and tasks together and materializeSectionKeys nulled unresolvable
      // sprintKeys. Split across pages, that cleanup would never happen until someone re-saved
      // Tasks — leaving tasks linked to a sprint that no longer exists. So repair exactly those
      // references (and nothing else about a task) in the same save.
      const liveSprintKeys = new Set(materializedSprints.map((sprint) => sprint?.key).filter(Boolean));
      // Re-read the tasks immediately before writing them, rather than using the copy captured
      // when this page loaded. Sending the load-time snapshot back turned a sprint save into a
      // silent full replace of the tasks section: any task added or edited on the Tasks tab since
      // this page opened was reverted, and the repair itself is the only reason tasks are in this
      // payload at all. If the re-read fails, skip the repair rather than write a stale list —
      // the next save of Tasks does the same cleanup.
      let storedTasks = null;
      try {
        const fresh = await fetchWithErrorHandling(getProjectTemplateById(templateId, collegeId));
        if (fresh?.success) storedTasks = toArrayValue(unwrapApiItem(fresh)?.tasks);
      } catch (_) {
        storedTasks = null;
      }
      const orphanedTasks =
        storedTasks !== null && storedTasks.some((task) => task?.sprintKey && !liveSprintKeys.has(task.sprintKey));
      await updateProjectTemplate(templateId, collegeId, {
        ...templateScalars(template),
        sprints: materializedSprints,
        ...(orphanedTasks
          ? { tasks: storedTasks.map((task) => (task?.sprintKey && !liveSprintKeys.has(task.sprintKey) ? { ...task, sprintKey: null } : task)) }
          : {}),
      });
      message.success("Sprints saved");
      form.resetFields();
      await loadTemplate();
    } catch (e) {
      showProjectError(e, { fallback: "Failed to save sprints" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ln-module admin-list-page">
      <SuperAdminTemplateShell
        templateId={templateId}
        title={template ? normaliseCollegeScopedName(template, "Template") : "Template"}
        subtitle="The sprints every workspace created from this template starts with."
      >
        {error ? (
          <Alert type="error" message="Template could not be loaded" description={error} showIcon style={{ marginBottom: 16 }} />
        ) : null}

        <Skeleton loading={loading} active paragraph={{ rows: 8 }}>
          {template ? (
            <Card className="admin-form-card">
              <Paragraph type="secondary">
                No start/end dates here on purpose — a template seeds many workspaces, each starting on a different day, so a
                materialized sprint&apos;s dates are computed from its own workspace&apos;s start date instead.
              </Paragraph>
              <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item name="sprints" rules={[{ validator: validateRepeatingItems(SPRINT_FIELDS) }]}>
                  <RepeatingItemEditor
                    fields={SPRINT_FIELDS}
                    titleOf={titleOfSprintOrTask}
                    addLabel="Add sprint"
                    emptyText="No sprints yet."
                  />
                </Form.Item>
                <div className="admin-form-actions">
                  <Button type="primary" htmlType="submit" loading={saving}>
                    Save sprints
                  </Button>
                </div>
              </Form>
            </Card>
          ) : (
            !loading && <Alert type="warning" message="Template not found" showIcon />
          )}
        </Skeleton>
      </SuperAdminTemplateShell>
    </div>
  );
}

SuperAdminProjectTemplateSprintsPage.superAdminLayout = SuperAdminLayout;
