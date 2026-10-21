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
import { RESOURCE_FIELDS, titleOfResource, materializeSectionKeys } from "@/components/admin/projects/projectSectionFieldConfigs";

const { Paragraph } = Typography;

export default function SuperAdminProjectTemplateResourcesPage() {
  const router = useRouter();
  const { selectedCollegeId: collegeId } = useSuperAdminScope();
  const templateId = router.query.templateId;
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [template, setTemplate] = useState(null);

  useUnsavedFormGuard(form, { enabled: Boolean(template) });

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
          form.setFieldsValue({ resources: toArrayValue(item?.resources) });
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
      const { resources } = materializeSectionKeys([], [], values.resources);
      await updateProjectTemplate(templateId, collegeId, {
        ...templateScalars(template),
        resources,
      });
      message.success("Resources saved");
      form.resetFields();
      await loadTemplate();
    } catch (e) {
      // The backend rejects unsafe resource URLs (javascript:/data:) — surface that message
      // rather than a generic failure.
      showProjectError(e, { fallback: "Failed to save resources" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ln-module admin-list-page">
      <SuperAdminTemplateShell
        templateId={templateId}
        title={template ? normaliseCollegeScopedName(template, "Template") : "Template"}
        subtitle="Reading material and links copied into every workspace created from this template."
      >
        {error ? (
          <Alert type="error" message="Template could not be loaded" description={error} showIcon style={{ marginBottom: 16 }} />
        ) : null}

        <Skeleton loading={loading} active paragraph={{ rows: 8 }}>
          {template ? (
            <Card className="admin-form-card">
              <Paragraph type="secondary">
                Links must be ordinary http(s) URLs — the server rejects javascript:/data: URLs on save.
              </Paragraph>
              <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item name="resources" rules={[{ validator: validateRepeatingItems(RESOURCE_FIELDS) }]}>
                  <RepeatingItemEditor
                    fields={RESOURCE_FIELDS}
                    titleOf={titleOfResource}
                    addLabel="Add resource"
                    emptyText="No resources yet."
                  />
                </Form.Item>
                <div className="admin-form-actions">
                  <Button type="primary" htmlType="submit" loading={saving}>
                    Save resources
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

SuperAdminProjectTemplateResourcesPage.superAdminLayout = SuperAdminLayout;
