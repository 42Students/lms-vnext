import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Button, Card, Descriptions, Empty, Space, Tag, Typography } from "antd";
import { PlusOutlined, ReadOutlined } from "@ant-design/icons";
import AdminLayout from "@/layouts/AdminLayout";
import AdminGroupShell from "@/components/admin/AdminGroupShell";
import { DetailSkeleton } from "@/components/Common/Skeletons";
import { useDispatch, useSelector } from "react-redux";
import { appAction } from "@/redux/store";
import {
  fetchWithErrorHandling,
  getProjectTemplateById,
} from "@/api/Services/AdminService";
import {
  formatTimestamp,
  normaliseCollegeScopedName,
  statusColor,
  statusLabel,
  templateSectionCount,
  textOrDash,
  unwrapApiItem,
} from "@/components/admin/projects/adminProjectUtils";
import renderStructuredValue from "@/components/admin/projects/renderStructuredValue";

const { Title, Paragraph, Text } = Typography;

// Only `goal`/`deliverables` are the two keys that matter on an overview object (see
// meaningfulOverviewKeyCount's own comment in adminProjectUtils.js) — everything else is
// legacy/junk "facts" carried over from old rows. Restricting the Overview card's own render to
// that same allowlist keeps it consistent with the "Overview N" count tag above it, which already
// only counts goal/deliverables — rendering every raw key here previously showed more rows than
// the count claimed existed.
const OVERVIEW_ALLOWED_KEYS = ["goal", "deliverables"];
const OVERVIEW_LABELS = { goal: "Goal", deliverables: "Deliverables" };

const renderSection = (label, value, { overviewOnly = false } = {}) => {
  const entries = overviewOnly && value && typeof value === "object" && !Array.isArray(value)
    ? Object.entries(value).filter(([key]) => OVERVIEW_ALLOWED_KEYS.includes(key))
    : value && typeof value === "object" && !Array.isArray(value)
      ? Object.entries(value)
      : [];
  return (
    <Card size="small" title={label} className="admin-list-page__card-gap">
      {Array.isArray(value) ? (
        value.length ? (
          <Space wrap size={[8, 8]}>
            {value.map((item, index) => (
              <Tag key={`${label}-${index}`}>{typeof item === "object" ? textOrDash(item?.title || item?.name || item?.label) : textOrDash(item)}</Tag>
            ))}
          </Space>
        ) : (
          <Empty description={`No ${label.toLowerCase()} configured`} />
        )
      ) : entries.length > 0 ? (
        <Descriptions column={1} size="small" bordered>
          {entries.map(([key, val]) => (
            <Descriptions.Item key={key} label={OVERVIEW_LABELS[key] || key}>
              {renderStructuredValue(val)}
            </Descriptions.Item>
          ))}
        </Descriptions>
      ) : (
        <Text type="secondary">No {label.toLowerCase()} provided.</Text>
      )}
    </Card>
  );
};

// Project templates went global (V136__project_template_global.sql): they're a single
// platform-wide catalog super-admin creates and maintains — the ~10 industrial projects handed
// to every college, not something a college builds for itself. This page is read-only by design:
// browse what's in the template, then use it. Editing/publishing/archiving/duplicating/rollback
// all moved to the superadmin console (and the backend rejects them here regardless of what the
// UI shows, so this isn't just cosmetic).
export default function AdminProjectTemplateDetailPage() {
  const router = useRouter();
  const loginUser = useSelector((state) => state.loginUser);
  const dispatch = useDispatch();
  const collegeId = loginUser?.collegeId ?? null;

  useEffect(() => {
    dispatch(appAction.setActiveMenuItem("projects"));
  }, [dispatch]);
  const templateId = router.query.templateId;

  // Starts true: the router's query (and so templateId) is undefined on the first client
  // render, and with `loading` false that paint fell through to "Template not found".
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [template, setTemplate] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!collegeId || !templateId) return;
      setLoading(true);
      setError(null);
      try {
        const templateResult = await fetchWithErrorHandling(getProjectTemplateById(templateId, collegeId));
        if (!mounted) return;
        if (templateResult.success) {
          setTemplate(unwrapApiItem(templateResult));
        } else {
          setTemplate(null);
          setError(templateResult?.message || "Failed to load template.");
        }
      } catch (e) {
        if (!mounted) return;
        setTemplate(null);
        setError(e?.message || "Failed to load template.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [collegeId, templateId, reloadKey]);

  const sectionCounts = useMemo(() => {
    if (!template) return {};
    return {
      overview: templateSectionCount(template, "overview"),
      sprints: templateSectionCount(template, "sprints"),
      tasks: templateSectionCount(template, "tasks"),
      resources: templateSectionCount(template, "resources"),
    };
  }, [template]);

  if (!collegeId) {
    return (
      <div className="ln-module admin-list-page">
        {/* Inside the shell: a missing college is a state to recover from, and dropping the
            tab strip and every other navigation affordance is the one thing that makes it
            harder. */}
        <AdminGroupShell groupKey="projects">
          <Alert type="warning" message="Admin not assigned to a college" description="You must be assigned to a college to view project templates." showIcon />
        </AdminGroupShell>
      </div>
    );
  }

  return (
    <div className="ln-module admin-list-page">
      <AdminGroupShell groupKey="projects">
      <div className="admin-list-page__header">
        <div>
          <h1 className="admin-list-page__title">Project template</h1>
          <div className="admin-list-page__subtitle">Maintained by 42Students — use this template to start a workspace.</div>
        </div>
        <Space wrap>
          <Button onClick={() => router.push("/college-admin/projects/templates")}>
            Back to templates
          </Button>
          {/* No Preview button: /{id}/preview is literally `return getProjectTemplate(...)` on
              the controller, so the modal re-fetched the same payload and re-rendered the very
              sections already on screen behind it. This page IS the preview. */}
          {/* Hands off to the one real creation form with this template pre-selected, rather
              than opening a second, weaker one here. The modal this replaced posted no mentor and
              no learners, so a workspace created from it was born mentorless — immediately flagged
              by the at-risk report on the next tab. Two creation paths, two rule sets, one of them
              producing workspaces the other would have rejected. */}
          <Button type="primary" icon={<PlusOutlined />} disabled={!template} onClick={() => router.push(`/college-admin/projects/workspaces/new?templateId=${encodeURIComponent(templateId ?? "")}`)}>
            Use this template
          </Button>
        </Space>
      </div>

      {error ? (
        <Alert
          type="error"
          message="Template could not be loaded"
          description={error}
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={() => setReloadKey((prev) => prev + 1)}>
              Retry
            </Button>
          }
        />
      ) : null}

      {loading ? (
        <DetailSkeleton label="Loading project template" withMedia={false} />
      ) : template ? (
          <>
            <Card className="admin-list-page__card-gap">
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <div>
                  <Space wrap>
                    <Tag color={statusColor(template?.lifecycleStatus || template?.status)}>
                      {statusLabel(template?.lifecycleStatus || template?.status)}
                    </Tag>
                    <Tag icon={<ReadOutlined />}>Version {textOrDash(template?.templateVersion)}</Tag>
                  </Space>
                </div>
                <Title level={3} style={{ marginBottom: 0 }}>
                  {normaliseCollegeScopedName(template, "Template")}
                </Title>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  {textOrDash(template?.summary)}
                </Paragraph>
                {/* A whole separate "Template metadata" Card for this single data point was
                    heavier structure than the content justified — folded into the header card. */}
                <Text type="secondary">Published at: {formatTimestamp(template?.publishedAt)}</Text>
              </Space>
            </Card>

            <Card title="Section counts" className="admin-list-page__card-gap">
              <Space wrap>
                <Tag>Overview {sectionCounts.overview ?? 0}</Tag>
                <Tag>Sprints {sectionCounts.sprints ?? 0}</Tag>
                <Tag>Tasks {sectionCounts.tasks ?? 0}</Tag>
                <Tag>Resources {sectionCounts.resources ?? 0}</Tag>
              </Space>
            </Card>

            {renderSection("Overview", template?.overview, { overviewOnly: true })}
            {renderSection("Sprints", template?.sprints)}
            {renderSection("Tasks", template?.tasks)}
            {renderSection("Resources", template?.resources)}
          </>
        ) : (
          // Only when there is no error to show: an error alert already explains the blank
          // page above, and "Template not found" underneath it contradicted it.
          !error && <Empty description="Template not found" />
        )}
      </AdminGroupShell>
    </div>
  );
}

AdminProjectTemplateDetailPage.adminLayout = AdminLayout;
