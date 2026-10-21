import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Button, Card, Empty, Input, Skeleton, Space, Table, Tag, Typography } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { exportRowsToCsv } from "@/utils/csvExport";
import AdminLayout from "@/layouts/AdminLayout";
import AdminGroupShell from "@/components/admin/AdminGroupShell";
import { useDispatch, useSelector } from "react-redux";
import { appAction } from "@/redux/store";
import { fetchWithErrorHandling, getProjectTemplatesByCollege } from "@/api/Services/AdminService";
import {
  asArray,
  normaliseCollegeScopedName,
  templateSectionCount,
  textOrDash,
  unwrapApiList,
} from "@/components/admin/projects/adminProjectUtils";

const { Text } = Typography;

// Project templates went global (V136__project_template_global.sql): a single platform-wide
// catalog super-admin creates and maintains — the ~10 industrial projects handed to every
// college — not something each college builds for itself. This page is browse-and-use only:
// no Create/Edit/Archive here, and no lifecycle filter, since the backend only ever returns
// PUBLISHED templates to a college-admin caller (drafts/archived are super-admin's editing
// concern, not something to show here half-finished). "Migrate legacy workspaces" moved to the
// superadmin console for the same reason — it creates new templates too.
export default function AdminProjectTemplatesPage() {
  const router = useRouter();
  const loginUser = useSelector((state) => state.loginUser);
  const dispatch = useDispatch();
  const collegeId = loginUser?.collegeId ?? null;

  useEffect(() => {
    dispatch(appAction.setActiveMenuItem("projects"));
  }, [dispatch]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState("");
  const [hydratedFromUrl, setHydratedFromUrl] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Restore search from the URL on load, mirroring the ?fromMentorId= pattern in
  // reassign-mentor/index.js, so a shared/reloaded link lands back on the same filtered view.
  useEffect(() => {
    if (!router.isReady || hydratedFromUrl) return;
    const q = router.query;
    if (q.search !== undefined) setSearch(String(q.search));
    setHydratedFromUrl(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, hydratedFromUrl]);

  // Keep the URL addressable/shareable — reflect the current filter into the query string
  // without triggering a navigation (shallow routing).
  useEffect(() => {
    if (!hydratedFromUrl) return;
    router.replace(
      { pathname: router.pathname, query: Object.fromEntries(Object.entries({ ...router.query, search: search || undefined }).filter(([, value]) => value !== undefined && value !== null && value !== "")) },
      undefined,
      { shallow: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, hydratedFromUrl]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!collegeId) return;
      setLoading(true);
      setError(null);
      try {
        const result = await fetchWithErrorHandling(getProjectTemplatesByCollege(collegeId, { search: search || undefined }));
        if (!mounted) return;
        if (result.success) {
          setTemplates(asArray(unwrapApiList(result)));
        } else {
          setTemplates([]);
          setError(result?.message || "Failed to load project templates.");
        }
      } catch (e) {
        if (!mounted) return;
        setTemplates([]);
        setError(e?.message || "Failed to load project templates.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    const timeout = setTimeout(load, search ? 350 : 0);
    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [collegeId, search, reloadKey]);

  const columns = useMemo(
    () => [
      {
        title: "Template",
        key: "template",
        render: (_, template) => (
          <div>
            <div style={{ fontWeight: 600 }}>{normaliseCollegeScopedName(template, "Template")}</div>
            <Text type="secondary">{textOrDash(template?.summary)}</Text>
          </div>
        ),
      },
      {
        title: "Version",
        key: "version",
        render: (_, template) => textOrDash(template?.templateVersion),
      },
      // No Status column here, unlike the superadmin copy of this list: getProjectTemplates
      // filters to PUBLISHED for every non-superadmin caller, so every row carried the identical
      // "Published" tag. A column with one possible value is a column of noise.
      {
        title: "Sections",
        key: "sections",
        render: (_, template) => (
          <Space wrap size={[8, 8]}>
            <Tag>Overview {templateSectionCount(template, "overview")}</Tag>
            <Tag>Sprints {templateSectionCount(template, "sprints")}</Tag>
            <Tag>Tasks {templateSectionCount(template, "tasks")}</Tag>
            <Tag>Resources {templateSectionCount(template, "resources")}</Tag>
          </Space>
        ),
      },
      {
        title: "Action",
        key: "action",
        render: (_, template) => (
          <Button type="link" onClick={() => router.push(`/college-admin/projects/templates/${encodeURIComponent(template?.id ?? "")}`)}>
            View &amp; use
          </Button>
        ),
      },
    ],
    []
  );

  if (!collegeId) {
    return (
      <div className="ln-module admin-list-page">
        {/* Inside the shell: a missing college is a state to recover from, and dropping the
            tab strip and every other navigation affordance is the one thing that makes it
            harder. */}
        <AdminGroupShell groupKey="projects">
          <Alert
            type="warning"
            message="Admin not assigned to a college"
            description="You must be assigned to a college before using project templates."
            showIcon
          />
        </AdminGroupShell>
      </div>
    );
  }

  return (
    <div className="ln-module admin-list-page">
      <AdminGroupShell groupKey="projects">
      <div className="admin-list-page__header">
        <div>
          <h1 className="admin-list-page__title">Project templates</h1>
          <div className="admin-list-page__subtitle">Pick a template to start a new project workspace.</div>
        </div>
      </div>

      {error ? (
        <Alert
          type="error"
          message="Templates could not be loaded"
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

      <Card
        title="Templates"
        extra={
          <Space wrap>
            <Input.Search
              allowClear
              placeholder="Search title or slug"
              style={{ width: 240 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button
              size="small"
              icon={<DownloadOutlined />}
              disabled={!templates.length}
              onClick={() =>
                exportRowsToCsv(
                  "project-templates.csv",
                  // CAT-01 (wrong exportRowsToCsv arity — empty file) fixed together with CAT-04
                  // (a college-admin's catalog is filtered to PUBLISHED only, so every row here
                  // has the same lifecycle value — the on-screen table already dropped that
                  // column as noise for exactly this reason, per the comment a few lines up; the
                  // export re-added it anyway, contradicting its own reasoning).
                  [
                    { label: "Title", key: "title" },
                    { label: "Version", key: "version" },
                    { label: "Summary", key: "summary" },
                  ],
                  templates.map((t) => ({
                    title: normaliseCollegeScopedName(t, "Template"),
                    version: t?.templateVersion ?? "",
                    summary: t?.summary ?? "",
                  }))
                )
              }
            >
              Export CSV
            </Button>
          </Space>
        }
      >
        <Skeleton loading={loading} active paragraph={{ rows: 6 }}>
          {error ? null : templates.length ? (
            <Table
              rowKey={(record) => record?.id ?? record?.slug}
              dataSource={templates}
              columns={columns}
              pagination={{ pageSize: 10, showSizeChanger: false }}
              scroll={{ x: "max-content" }}
            />
          ) : (
            <Empty
              description={
                search.trim()
                  ? "No templates match this search"
                  : "No templates are available to this college yet. Templates are published by 42Students and then assigned to your college — ask them to assign one."
              }
            />
          )}
        </Skeleton>
      </Card>
      </AdminGroupShell>
    </div>
  );
}

AdminProjectTemplatesPage.adminLayout = AdminLayout;
