import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import { TASK_FIELDS, titleOfSprintOrTask, materializeSectionKeys, sprintSelectOptions } from "@/components/admin/projects/projectSectionFieldConfigs";

const { Paragraph } = Typography;

export default function SuperAdminProjectTemplateTasksPage() {
  const router = useRouter();
  const { selectedCollegeId: collegeId } = useSuperAdminScope();
  const templateId = router.query.templateId;
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [template, setTemplate] = useState(null);

  useUnsavedFormGuard(form, { enabled: Boolean(template) });

  // Sprints are authored on their own page now, so the "Sprint" picker is built from the saved
  // sprint list rather than from live sibling form state.
  const storedSprints = useMemo(() => toArrayValue(template?.sprints), [template]);
  const sprintOptions = useMemo(() => sprintSelectOptions(storedSprints), [storedSprints]);

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
          form.setFieldsValue({ tasks: toArrayValue(item?.tasks) });
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
      // The saved sprints are passed in only so a task's sprintKey can be validated/remapped
      // against real sprints — only `tasks` is taken out of the result and sent.
      const { tasks } = materializeSectionKeys(storedSprints, values.tasks, []);
      await updateProjectTemplate(templateId, collegeId, {
        ...templateScalars(template),
        tasks,
      });
      message.success("Tasks saved");
      form.resetFields();
      await loadTemplate();
    } catch (e) {
      showProjectError(e, { fallback: "Failed to save tasks" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ln-module admin-list-page">
      <SuperAdminTemplateShell
        templateId={templateId}
        title={template ? normaliseCollegeScopedName(template, "Template") : "Template"}
        subtitle="The tasks every workspace created from this template starts with."
      >
        {error ? (
          <Alert type="error" message="Template could not be loaded" description={error} showIcon style={{ marginBottom: 16 }} />
        ) : null}

        <Skeleton loading={loading} active paragraph={{ rows: 8 }}>
          {template ? (
            <Card className="admin-form-card">
              {storedSprints.length ? null : (
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message="No sprints saved yet"
                  description={
                    <>
                      A task can only be linked to a sprint that already exists on this template.{" "}
                      <Link href={`/superadmin/projects/templates/${encodeURIComponent(templateId || "")}/sprints`}>Add sprints first</Link>, or
                      leave these tasks in the backlog.
                    </>
                  }
                />
              )}
              <Paragraph type="secondary">
                A task whose sprint has since been deleted is moved back to the backlog when you save.
              </Paragraph>
              <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item name="tasks" rules={[{ validator: validateRepeatingItems(TASK_FIELDS) }]}>
                  <RepeatingItemEditor
                    fields={TASK_FIELDS}
                    titleOf={titleOfSprintOrTask}
                    addLabel="Add task"
                    emptyText="No tasks yet."
                    dynamicOptions={{ sprintKey: sprintOptions }}
                  />
                </Form.Item>
                <div className="admin-form-actions">
                  <Button type="primary" htmlType="submit" loading={saving}>
                    Save tasks
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

SuperAdminProjectTemplateTasksPage.superAdminLayout = SuperAdminLayout;
