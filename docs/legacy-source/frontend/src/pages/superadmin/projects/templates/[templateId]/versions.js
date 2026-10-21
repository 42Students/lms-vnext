import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Button, Card, Empty, Modal, Pagination, Popconfirm, Skeleton, Space, Tag, Typography, message } from "antd";
import { ReadOutlined, RollbackOutlined } from "@ant-design/icons";
import { showProjectError } from "@/utils/projectErrorModal";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminTemplateShell from "@/components/admin/SuperAdminTemplateShell";
import renderStructuredValue from "@/components/admin/projects/renderStructuredValue";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";
import {
  fetchWithErrorHandling,
  getProjectTemplateById,
  getProjectTemplateImpact,
  getProjectTemplateVersionsPage,
  rollbackProjectTemplateVersion,
} from "@/api/Services/AdminService";
import {
  asArray,
  formatTimestamp,
  normaliseCollegeScopedName,
  statusLabel,
  textOrDash,
  unwrapApiItem,
  unwrapApiList,
} from "@/components/admin/projects/adminProjectUtils";

const { Text } = Typography;

export default function SuperAdminProjectTemplateVersionsPage() {
  const router = useRouter();
  const { selectedCollegeId: collegeId } = useSuperAdminScope();
  const templateId = router.query.templateId;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [template, setTemplate] = useState(null);
  const [versions, setVersions] = useState([]);
  const [versionPage, setVersionPage] = useState(0);
  const [totalVersions, setTotalVersions] = useState(0);
  const [diffTarget, setDiffTarget] = useState(null);
  const [comparedVersionId, setComparedVersionId] = useState(null);
  const [versionsError, setVersionsError] = useState(null);
  const [rollingBackId, setRollingBackId] = useState(null);
  // Loaded once alongside the template rather than per confirmation: the count is the same for
  // every version row. A failure leaves it null and the confirmation falls back to generic wording
  // rather than blocking the rollback.
  const [impact, setImpact] = useState(null);

  const load = useCallback(
    async (mountedRef) => {
      if (!templateId) return;
      setLoading(true);
      setError(null);
      try {
        const [templateResult, versionsResult] = await Promise.all([
          fetchWithErrorHandling(getProjectTemplateById(templateId, collegeId)),
          fetchWithErrorHandling(getProjectTemplateVersionsPage(templateId, collegeId, { page: versionPage, size: 25 })),
        ]);
        if (mountedRef && !mountedRef.current) return;
        if (templateResult.success) {
          setTemplate(unwrapApiItem(templateResult));
        } else {
          setTemplate(null);
          setError(templateResult?.message || "Failed to load template.");
        }
        if (versionsResult.success) {
          const pageData = unwrapApiItem(versionsResult) || {};
          setVersions(asArray(pageData.records));
          setTotalVersions(Number(pageData.totalRecords) || 0);
          setVersionsError(null);
        } else {
          // Distinguish "fetch failed" from "genuinely zero history" — rendering both as an empty
          // state leaves an admin no way to tell whether it's safe to roll back.
          setVersions([]);
          setTotalVersions(0);
          setVersionsError(versionsResult?.message || "Failed to load version history.");
        }
      } catch (e) {
        if (mountedRef && !mountedRef.current) return;
        setTemplate(null);
        setVersions([]);
        setError(e?.message || "Failed to load template.");
        setVersionsError(e?.message || "Failed to load version history.");
      } finally {
        if (!mountedRef || mountedRef.current) setLoading(false);
      }
    },
    [templateId, collegeId, versionPage]
  );

  const loadImpact = useCallback(
    async (mountedRef) => {
      if (!templateId) return;
      try {
        const res = await getProjectTemplateImpact(templateId, collegeId);
        if (mountedRef && !mountedRef.current) return;
        setImpact(res?.data?.data ?? res?.data ?? null);
      } catch {
        if (mountedRef && !mountedRef.current) return;
        setImpact(null);
      }
    },
    [templateId, collegeId]
  );

  useEffect(() => {
    const mountedRef = { current: true };
    load(mountedRef);
    loadImpact(mountedRef);
    return () => {
      mountedRef.current = false;
    };
  }, [load, loadImpact]);

  // Rollback restores the whole snapshot, not just the content sections: lifecycleStatus,
  // publishedAt, archivedAt and isDeleted come back too, so rolling back to a pre-publish revision
  // silently unpublishes the template, and to a pre-restore one re-soft-deletes it. The warning
  // used to describe only the content and the attached workspaces, which is the part an admin was
  // least likely to be surprised by.
  const ROLLBACK_SCOPE_NOTE =
    " Publication state travels with the snapshot: rolling back to a revision from before this template was published will unpublish it. Rollback is itself a new version, so it can be rolled back in turn.";

  const rollbackWarning = () => {
    const count = impact?.attachedWorkspaceCount;
    if (count == null) {
      return "The template's current content will be replaced with this version's snapshot." + ROLLBACK_SCOPE_NOTE;
    }
    if (count === 0) {
      return (
        "The template's current content will be replaced with this version's snapshot. Existing workspaces retain their pinned snapshots; this changes the template used for future creation." +
        ROLLBACK_SCOPE_NOTE
      );
    }
    const names = (impact?.sampleWorkspaces || []).map((w) => w.title).filter(Boolean);
    const more = count - names.length;
    const who = names.length ? ` (${names.join(", ")}${more > 0 ? `, and ${more} more` : ""})` : "";
    return `The template's current content will be replaced with this version's snapshot. These ${count} existing workspace${count === 1 ? "" : "s"}${who} retain pinned snapshots; the rollback affects future workspaces unless a template is deliberately reattached.${ROLLBACK_SCOPE_NOTE}`;
  };

  const handleRollback = async (versionId) => {
    // A fast double-click could otherwise apply the same rollback twice (bumping templateVersion
    // by 2 and writing two ROLLBACK history rows for one click).
    if (rollingBackId) return;
    setRollingBackId(versionId);
    try {
      // The template version this comparison was made against: edits saved since then make the rollback a 409 instead of
      // being erased (Projects audit R7-04).
      await rollbackProjectTemplateVersion(templateId, versionId, collegeId, template?.templateVersion);
      message.success("Template rolled back");
      setComparedVersionId(null);
      setVersionPage(0);
      await load();
      loadImpact();
    } catch (e) {
      showProjectError(e, { fallback: "Failed to roll back template" });
    } finally {
      setRollingBackId(null);
    }
  };

  return (
    <div className="ln-module admin-list-page">
      <SuperAdminTemplateShell
        templateId={templateId}
        title={template ? normaliseCollegeScopedName(template, "Template") : "Template"}
        subtitle="Browse the complete version history, compare a revision against the current template, then roll back if needed."
        actions={template ? <Tag icon={<ReadOutlined />}>Version {textOrDash(template?.templateVersion)}</Tag> : null}
      >
        {error ? (
          <Alert type="error" message="Template could not be loaded" description={error} showIcon style={{ marginBottom: 16 }} />
        ) : null}

        <Skeleton loading={loading} active paragraph={{ rows: 8 }}>
          {!loading && !template ? (
            <Alert type="warning" message="Template not found" showIcon />
          ) : (
          <Card title="Template versions">
            {versionsError ? (
              <Alert type="error" message="Version history could not be loaded" description={versionsError} showIcon />
            ) : versions.length ? (
              <Space direction="vertical" style={{ width: "100%" }}>
                {versions.map((version, index) => {
                  // The list is ordered newest-first, so the head row IS the template's current
                  // content. Rolling back to it is a no-op that still writes a ROLLBACK history
                  // row and bumps the version — and the old `versions.length > 1` test enabled the
                  // button on every row including this one, with nothing marking which was which.
                  const isCurrent = versionPage === 0 && index === 0;
                  return (
                  <Card key={version?.id ?? version?.templateVersion ?? index} size="small">
                    <Space style={{ width: "100%", justifyContent: "space-between" }} align="start">
                      <Space direction="vertical" size={4}>
                        <div style={{ fontWeight: 600 }}>
                          Version {textOrDash(version?.templateVersion)}
                          {isCurrent ? (
                            <Tag color="blue" style={{ marginLeft: 8 }}>
                              Current
                            </Tag>
                          ) : null}
                          {version?.actionType ? <Tag style={{ marginLeft: 8 }}>{statusLabel(version.actionType)}</Tag> : null}
                        </div>
                        <Text type="secondary">{textOrDash(version?.notes)}</Text>
                        <Text type="secondary">{formatTimestamp(version?.changedAt)}</Text>
                      </Space>
                      {version?.id ? (
                        !isCurrent ? (
                          <Space>
                          <Button size="small" onClick={() => { setDiffTarget(version); setComparedVersionId(null); }}>Compare changes</Button>
                          <Popconfirm
                            title="Roll back to this version?"
                            description={rollbackWarning()}
                            okText="Roll back"
                            okButtonProps={{ loading: rollingBackId === version.id }}
                            onConfirm={() => handleRollback(version.id)}
                          >
                            <Button size="small" icon={<RollbackOutlined />} disabled={comparedVersionId !== version.id} title={comparedVersionId !== version.id ? "Compare this revision before rollback" : undefined} loading={rollingBackId === version.id}>
                              Roll back
                            </Button>
                          </Popconfirm>
                          </Space>
                        ) : (
                          <Button size="small" icon={<RollbackOutlined />} disabled title="This is the template's current content">
                            Roll back
                          </Button>
                        )
                      ) : null}
                    </Space>
                  </Card>
                  );
                })}
                <Pagination current={versionPage + 1} pageSize={25} total={totalVersions} showSizeChanger={false} onChange={(page) => { setVersionPage(page - 1); setComparedVersionId(null); }} />
              </Space>
            ) : (
              <Empty description="No version history available" />
            )}
          </Card>
          )}
        </Skeleton>
      </SuperAdminTemplateShell>
      <Modal open={!!diffTarget} title={`Compare version ${diffTarget?.templateVersion ?? ""} with current template`} width={860} onCancel={() => setDiffTarget(null)} onOk={() => { setComparedVersionId(diffTarget?.id); setDiffTarget(null); }} okText="I reviewed these changes" destroyOnClose>
        <Alert type="warning" showIcon message="Review changed fields before enabling rollback" description={rollbackWarning()} style={{ marginBottom: 12 }} />
        {(() => {
          const raw = diffTarget?.snapshotJson;
          let snapshot = raw;
          try { if (typeof snapshot === "string") snapshot = JSON.parse(snapshot); } catch { snapshot = null; }
          if (!snapshot || typeof snapshot !== "object") return <Alert type="error" showIcon message="Version snapshot could not be read. Do not roll back without a verified diff." />;
          const keys = ["title", "slug", "summary", "courseLabel", "status", "phase", "lifecycleStatus", "overview", "sprints", "tasks", "resources", "delivery", "meetings", "activity"];
          const changed = keys.filter((key) => JSON.stringify(snapshot[key] ?? null) !== JSON.stringify(template?.[key] ?? null));
          return changed.length ? changed.map((key) => (
            <Card key={key} size="small" title={key} style={{ marginBottom: 8 }}>
              <Text strong>Current</Text>
              <div style={{ marginBottom: 8, maxHeight: 220, overflow: "auto" }}>{renderStructuredValue(template?.[key] ?? null)}</div>
              <Text strong>Selected version</Text>
              <div style={{ maxHeight: 220, overflow: "auto" }}>{renderStructuredValue(snapshot[key] ?? null)}</div>
            </Card>
          )) : <Alert type="info" showIcon message="No differences found in the compared template fields." />;
        })()}
      </Modal>
    </div>
  );
}

SuperAdminProjectTemplateVersionsPage.superAdminLayout = SuperAdminLayout;
