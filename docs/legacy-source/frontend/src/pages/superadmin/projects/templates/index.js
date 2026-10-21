import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Button, Card, Empty, Input, Popconfirm, Select, Skeleton, Space, Table, Tag, Typography, message } from "antd";
import { showProjectError } from "@/utils/projectErrorModal";
import { InboxOutlined, DownloadOutlined } from "@ant-design/icons";
import { exportRowsToCsv } from "@/utils/csvExport";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminGroupShell from "@/components/admin/SuperAdminGroupShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";
import {
  archiveProjectTemplate,
  fetchWithErrorHandling,
  getProjectTemplatesByCollege,
} from "@/api/Services/AdminService";
import {
  asArray,
  isArchivedStatus,
  normaliseCollegeScopedName,
  statusColor,
  statusLabel,
  templateSectionCount,
  textOrDash,
  unwrapApiList,
} from "@/components/admin/projects/adminProjectUtils";

const { Text } = Typography;

const LIFECYCLE_STATUS_OPTIONS = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export default function SuperAdminProjectTemplatesPage() {
  const router = useRouter();
  const { selectedCollegeId: collegeId } = useSuperAdminScope();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [archivingId, setArchivingId] = useState(null);
  const [search, setSearch] = useState("");
  const [lifecycleStatus, setLifecycleStatus] = useState(undefined);
  const [hydratedFromUrl, setHydratedFromUrl] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const requestSeq = useRef(0);
  const prevSearchRef = useRef("");
  // Opt-in per-college template visibility (V140__project_template_college_assignment.sql) is no
  // longer edited here. It was a college-keyed Transfer on this list page, which meant assigning
  // ONE template required first selecting a college in the header and then finding that template
  // among every other one. It now lives on the template's own Colleges tab, scoped to that
  // template, at templates/[templateId]/colleges.js.
  //
  // "Migrate legacy workspaces" (backfilling pre-template-system workspaces onto the template
  // system) was removed from here entirely, at the user's direction, along with its backend
  // endpoint — see the deletion note on ProjectWorkspaceService (the interface method used to
  // live at #migrateProjectWorkspacesFromCurrentState). It had zero frontend callers before this
  // page was built, and once built it was a bulk "generate a template from whatever a workspace
  // currently looks like" action sitting behind one click and a single confirmation modal — not
  // proportionate to how rarely, if ever, it was actually needed.

  // Restore search/status from the URL on load, mirroring the ?fromMentorId= pattern in
  // reassign-mentor/index.js, so a shared/reloaded link lands back on the same filtered view.
  useEffect(() => {
    if (!router.isReady || hydratedFromUrl) return;
    const q = router.query;
    if (q.search !== undefined) setSearch(String(q.search));
    // A bad/stale ?status= value would desync the Select (which renders with nothing matching,
    // looking cleared) from the actual server-side filter still holding the bogus value — fall
    // back to "All" instead of passing an unrecognized status through.
    if (q.status !== undefined) {
      const candidate = String(q.status);
      setLifecycleStatus(LIFECYCLE_STATUS_OPTIONS.includes(candidate) ? candidate : undefined);
    }
    setHydratedFromUrl(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, hydratedFromUrl]);

  // Keep the URL addressable/shareable — reflect the current filters into the query string
  // without triggering a navigation (shallow routing).
  useEffect(() => {
    if (!hydratedFromUrl) return;
    router.replace(
      { pathname: router.pathname, query: Object.fromEntries(Object.entries({ ...router.query, search: search || undefined, status: lifecycleStatus || undefined }).filter(([, value]) => value !== undefined && value !== null && value !== "")) },
      undefined,
      { shallow: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, lifecycleStatus, hydratedFromUrl]);

  useEffect(() => {
    let mounted = true;
    const requestId = ++requestSeq.current;
    const load = async () => {
      // Templates are a global catalog now (V136__project_template_global.sql) — super-admin
      // doesn't need a college selected in the header just to browse/manage them.
      setLoading(true);
      setError(null);
      try {
        const result = await fetchWithErrorHandling(getProjectTemplatesByCollege(collegeId, { lifecycleStatus, search: search || undefined }));
        // A slower earlier request (e.g. a broad search) landing after a faster later one (a
        // narrower lifecycle-status filter) previously overwrote the newer, already-applied
        // filter's rows with stale data while the visible controls still showed the newer
        // filter — only apply the response tied to the most-recently-issued request.
        if (!mounted || requestId !== requestSeq.current) return;
        if (result.success) {
          setTemplates(asArray(unwrapApiList(result)));
        } else {
          setTemplates([]);
          setError(result?.message || "Failed to load project templates.");
        }
      } catch (e) {
        if (!mounted || requestId !== requestSeq.current) return;
        setTemplates([]);
        setError(e?.message || "Failed to load project templates.");
      } finally {
        if (mounted && requestId === requestSeq.current) {
          setLoading(false);
          setHasLoadedOnce(true);
        }
      }
    };
    // Only debounce when `search` is actually the value that changed — otherwise changing the
    // lifecycle-status filter while a search term is present incurred an unnecessary 350ms stall
    // on an action that isn't a keystroke and doesn't need debouncing.
    const searchChanged = search !== prevSearchRef.current;
    prevSearchRef.current = search;
    const timeout = setTimeout(load, searchChanged ? 350 : 0);
    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
    // `collegeId` stays in the deps even though the backend returns the whole catalog to a
    // superadmin regardless of it, so switching college refetches an identical list. Removing it
    // while still *passing* it to the request would be a stale-closure bug the day that endpoint
    // starts scoping by college — one wasted request on a scope change is the cheaper mistake.
  }, [collegeId, search, lifecycleStatus, reloadKey]);

  const handleArchive = async (template) => {
    // No `?? template.slug` fallback: AdminProjectTemplateController declares
    // @PathVariable Integer templateId, so passing a slug is a 400, not a graceful degradation.
    // (Workspace routes are the opposite — those take a String and resolve a slug — so don't
    // "fix" those to match this.)
    const templateId = template?.id;
    setArchivingId(templateId);
    try {
      await archiveProjectTemplate(templateId, collegeId);
      message.success("Template archived");
      setTemplates((prev) => prev.filter((item) => item?.id !== templateId));
    } catch (e) {
      showProjectError(e, { fallback: "Failed to archive template" });
    } finally {
      setArchivingId(null);
    }
  };

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
      {
        title: "Lifecycle",
        key: "lifecycle",
        render: (_, template) => (
          <Tag color={statusColor(template?.lifecycleStatus || template?.status)}>
            {statusLabel(template?.lifecycleStatus || template?.status)}
          </Tag>
        ),
      },
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
          <Space>
            {/* One destination now: the template's own section pages, which both show and edit
                each concern — there is no separate read view and edit form to choose between. */}
            <Button type="link" onClick={() => router.push(`/superadmin/projects/templates/${encodeURIComponent(template?.id ?? "")}/overview`)}>
              Open
            </Button>
            <Popconfirm
              title={`Archive "${normaliseCollegeScopedName(template, "this template")}"?`}
              description="Existing workspaces stay linked and keep working, but this template will no longer be offered for new workspaces."
              okText="Archive"
              okButtonProps={{ danger: true, loading: archivingId === template?.id }}
              onConfirm={() => handleArchive(template)}
              disabled={isArchivedStatus(template?.lifecycleStatus || template?.status)}
            >
              <Button
                icon={<InboxOutlined />}
                danger
                loading={archivingId === template?.id}
                // Backend archives via findActiveById, which already excludes archived rows —
                // clicking Archive again throws "Project template not found" instead of no-op-ing.
                disabled={isArchivedStatus(template?.lifecycleStatus || template?.status)}
              >
                Archive
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [archivingId, collegeId]
  );

  return (
    <div className="ln-module admin-list-page">
      <SuperAdminGroupShell groupKey="projects">
      <div className="admin-list-page__header">
        <div>
          <h1 className="admin-list-page__title">Project templates</h1>
          <div className="admin-list-page__subtitle">A single catalog every college draws from — college-admin can use these but not edit them.</div>
        </div>
        <Space wrap>
          <Button type="primary" onClick={() => router.push("/superadmin/projects/templates/new")}>
            Create template
          </Button>
        </Space>
      </div>

      {error ? (
        <Alert type="error" message="Templates could not be loaded" description={error} showIcon style={{ marginBottom: 16 }} action={<Button size="small" onClick={() => setReloadKey((value) => value + 1)}>Retry</Button>} />
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
            <Select
              allowClear
              placeholder="Lifecycle status"
              className="admin-list-page__filter"
              value={lifecycleStatus}
              onChange={setLifecycleStatus}
              getPopupContainer={() => document.body}
              options={[
                { value: "DRAFT", label: "Draft" },
                { value: "PUBLISHED", label: "Published" },
                { value: "ARCHIVED", label: "Archived" },
              ]}
            />
            <Button
              size="small"
              icon={<DownloadOutlined />}
              disabled={!templates.length}
              onClick={() =>
                exportRowsToCsv(
                  "project-templates.csv",
                  // SAT-01: exportRowsToCsv(filename, columns, rows) needs a {label,key}[] columns
                  // array as its 2nd argument — this call passed only the mapped rows, so `rows`
                  // was undefined and every export downloaded an empty file. Super-admin sees
                  // every lifecycle state (draft/published/archived), unlike the college-admin
                  // catalog which only ever shows PUBLISHED — so lifecycle is real information
                  // here and stays in the export (see the college-admin twin's fix for why it's
                  // dropped there).
                  [
                    { label: "Title", key: "title" },
                    { label: "Version", key: "version" },
                    { label: "Lifecycle", key: "lifecycle" },
                    { label: "Summary", key: "summary" },
                  ],
                  templates.map((t) => ({
                    title: normaliseCollegeScopedName(t, "Template"),
                    version: t?.templateVersion ?? "",
                    lifecycle: t?.lifecycleStatus || t?.status || "",
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
        {/* The full Skeleton is reserved for the true first load — once a page has rendered once,
            a subsequent refetch (e.g. a debounced search keystroke) keeps the existing rows
            visible under the Table's own lighter loading overlay instead of swapping the whole
            card body out again. */}
        <Skeleton loading={loading && !hasLoadedOnce} active paragraph={{ rows: 6 }}>
          {/* On a load error, showing "No templates match your filters" underneath the error Alert
              above wrongly blamed the admin's own filters for what is actually a fetch failure —
              suppress the empty state (and the table) while `error` is set; the Alert already
              explains why there's nothing to show. */}
          {!error && templates.length ? (
            <Table
              loading={hasLoadedOnce ? loading : false}
              rowKey={(record) => record?.id ?? record?.slug ?? JSON.stringify(record)}
              dataSource={templates}
              columns={columns}
              pagination={{ pageSize: 10, showSizeChanger: false }}
              scroll={{ x: "max-content" }}
            />
          ) : !error ? (
            <Empty description="No templates match your filters" />
          ) : null}
        </Skeleton>
      </Card>

      </SuperAdminGroupShell>
    </div>
  );
}

SuperAdminProjectTemplatesPage.superAdminLayout = SuperAdminLayout;
