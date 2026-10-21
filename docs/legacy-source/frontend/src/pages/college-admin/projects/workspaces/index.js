import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Alert, Button, Card, Empty, Input, Popconfirm, Progress, Select, Skeleton, Space, Table, Tag, message } from "antd";
import { showProjectError } from "@/utils/projectErrorModal";
import { InboxOutlined, DownloadOutlined } from "@ant-design/icons";
import { exportRowsToCsv } from "@/utils/csvExport";
import AdminLayout from "@/layouts/AdminLayout";
import AdminGroupShell from "@/components/admin/AdminGroupShell";
import { useDispatch, useSelector } from "react-redux";
import { appAction } from "@/redux/store";
import { archiveProject, fetchWithErrorHandling, getProjectsByCollegePage } from "@/api/Services/AdminService";
import {
  asArray,
  isArchivedStatus,
  normaliseCollegeScopedName,
  projectMemberCount,
  projectMentorMember,
  projectProgress,
  projectStatus,
  statusColor,
  statusLabel,
  textOrDash,
  unwrapApiItem,
} from "@/components/admin/projects/adminProjectUtils";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const STATUS_OPTIONS = ["ACTIVE", "IN_PROGRESS", "READY", "BLOCKED", "ARCHIVED"];

export default function AdminProjectWorkspacesPage() {
  const router = useRouter();
  const loginUser = useSelector((state) => state.loginUser);
  const dispatch = useDispatch();
  const collegeId = loginUser?.collegeId ?? null;

  useEffect(() => {
    dispatch(appAction.setActiveMenuItem("projects"));
  }, [dispatch]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [archivingId, setArchivingId] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(undefined);
  const [reloadKey, setReloadKey] = useState(0);
  const [hydratedFromUrl, setHydratedFromUrl] = useState(false);
  const requestSeq = useRef(0);

  // Restore search/status/pagination from the URL on load, mirroring the ?fromMentorId= pattern
  // in reassign-mentor/index.js, so a shared/reloaded link lands back on the same filtered view.
  useEffect(() => {
    if (!router.isReady || hydratedFromUrl) return;
    const q = router.query;
    if (q.search !== undefined) setSearch(String(q.search));
    // A bad/stale ?status= value would desync the Select (which renders with nothing matching,
    // looking cleared) from the actual server-side filter still holding the bogus value — fall
    // back to "All" instead of passing an unrecognized status through.
    if (q.status !== undefined) {
      const candidate = String(q.status);
      setStatus(STATUS_OPTIONS.includes(candidate) ? candidate : undefined);
    }
    if (q.page !== undefined) setPageNumber(Number(q.page) || 0);
    // Clamp to the page sizes the UI actually offers — the backend independently clamps to 100,
    // so an unclamped larger value here left the pagination control computing ranges against a
    // per-page count that didn't match what was actually fetched.
    if (q.pageSize !== undefined) {
      const candidate = Number(q.pageSize) || 20;
      setPageSize(PAGE_SIZE_OPTIONS.includes(candidate) ? candidate : 20);
    }
    setHydratedFromUrl(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, hydratedFromUrl]);

  // Reset to page 1 whenever the search/status filters change — otherwise a filter narrowing the
  // result set could leave the view on a now-nonexistent page. This must only fire on a filter
  // change made AFTER hydration, not on hydration itself: hydratedFromUrl flips true right after
  // URL hydration restores search/status/page from the URL, so depending on it directly made
  // "hydration just finished" look identical to a real filter change to this effect, immediately
  // zeroing a deep-linked ?page=4 back to page 1. Snapshot the filters once hydration completes
  // and only reset the page when they diverge from that post-hydration baseline, so restoring
  // ?page=4&status=Blocked from a bookmark actually lands on page 4.
  const filtersBaselineRef = useRef(null);
  useEffect(() => {
    if (!hydratedFromUrl) return;
    if (filtersBaselineRef.current === null) {
      filtersBaselineRef.current = { search, status };
      return;
    }
    if (search === filtersBaselineRef.current.search && status === filtersBaselineRef.current.status) return;
    filtersBaselineRef.current = { search, status };
    setPageNumber(0);
  }, [search, status, hydratedFromUrl]);

  // Keep the URL addressable/shareable — reflect the current filters/pagination into the query
  // string without triggering a navigation (shallow routing).
  useEffect(() => {
    if (!hydratedFromUrl) return;
    router.replace(
      {
        pathname: router.pathname,
        // pageSize omitted at its default, like every other param here — writing it always
        // meant a freshly-opened list carried ?pageSize=20 in a URL people copy and share.
        query: Object.fromEntries(Object.entries({
          ...router.query,
          search: search || undefined,
          status: status || undefined,
          page: pageNumber || undefined,
          pageSize: pageSize === 20 ? undefined : pageSize,
        }).filter(([, value]) => value !== undefined && value !== null && value !== "")),
      },
      undefined,
      { shallow: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, pageNumber, pageSize, hydratedFromUrl]);

  const prevSearchRef = useRef(search);
  useEffect(() => {
    let mounted = true;
    const requestId = ++requestSeq.current;
    const load = async () => {
      if (!collegeId) return;
      setLoading(true);
      setError(null);
      let willRefetch = false;
      try {
        const result = await fetchWithErrorHandling(
          getProjectsByCollegePage(collegeId, { status, search: search || undefined, page: pageNumber, size: pageSize })
        );
        // A slower earlier request (e.g. a heavy Status=Blocked query) landing after a faster
        // later one (Status=Archived) previously overwrote the newer, already-applied filter's
        // rows with stale data while the visible Select still showed the newer filter — only
        // apply the response tied to the most-recently-issued request.
        if (!mounted || requestId !== requestSeq.current) return;
        if (result.success) {
          const pageData = unwrapApiItem(result);
          const records = asArray(pageData?.records);
          const total = Number(pageData?.totalRecords) || 0;
          setProjects(records);
          setTotalRecords(total);
          // Archiving the last row(s) on a filtered page (e.g. status=Blocked, archiving the last
          // remaining rows on the last page) can shrink the result set below pageNumber without
          // ever reclamping it — step back a page rather than rendering an empty table under
          // pagination that still points at a page that no longer exists.
          if (records.length === 0 && total > 0 && pageNumber > 0) {
            // Jump to the last page that actually exists rather than stepping back one page per
            // round-trip: archiving most of a large filtered set otherwise walks backwards a page
            // at a time, refetching at every step.
            willRefetch = true;
            setPageNumber(Math.max(Math.ceil(total / pageSize) - 1, 0));
          }
        } else {
          setProjects([]);
          setTotalRecords(0);
          setError(result?.message || "Failed to load project workspaces.");
        }
      } catch (e) {
        if (!mounted || requestId !== requestSeq.current) return;
        setProjects([]);
        setTotalRecords(0);
        setError(e?.message || "Failed to load project workspaces.");
      } finally {
        // Keep the Skeleton up through the corrective re-fetch triggered above instead of
        // flashing antd's "No data" empty state for one paint between the two round-trips.
        if (mounted && requestId === requestSeq.current && !willRefetch) setLoading(false);
      }
    };
    // Only debounce when `search` is actually the value that changed — otherwise changing page,
    // status, or pageSize while a search term is present incurred an unnecessary 350ms stall on
    // an action that isn't a keystroke and doesn't need debouncing.
    const searchChanged = search !== prevSearchRef.current;
    prevSearchRef.current = search;
    const timeout = setTimeout(load, searchChanged ? 350 : 0);
    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [collegeId, search, status, pageNumber, pageSize, reloadKey]);

  const handleArchive = async (project) => {
    const projectId = project?.id ?? project?.slug ?? project?.numericId;
    setArchivingId(projectId);
    try {
      await archiveProject(projectId, collegeId);
      message.success("Workspace archived");
      // Refetch (rather than filtering the row out locally) so totalRecords and the current
      // page's row count stay consistent with the server now that this list is paginated.
      setReloadKey((prev) => prev + 1);
    } catch (e) {
      showProjectError(e, { fallback: "Failed to archive workspace" });
    } finally {
      setArchivingId(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "Workspace",
        key: "workspace",
        render: (_, project) => {
          const projectId = project?.id ?? project?.slug ?? project?.numericId;
          // Target the section directly rather than the bare workspace URL. That URL only works
          // because index.js redirects and forwards the query string; going straight to /summary
          // skips the extra hop and matches how the superadmin list links.
          const goToChangeTemplate = () => router.push(`/college-admin/projects/workspaces/${encodeURIComponent(projectId || "")}/summary?openTemplate=1&from=workspaces`);
          return (
            <Space direction="vertical" size={2}>
              <Button
                type="link"
                style={{ padding: 0, height: "auto", textAlign: "left", whiteSpace: "normal" }}
                onClick={() => router.push(`/college-admin/projects/workspaces/${encodeURIComponent(projectId || "")}/summary?from=workspaces`)}
              >
                {normaliseCollegeScopedName(project, "Workspace")}
              </Button>
              {!project?.templateId ? (
                <Tag
                  color="gold"
                  role="button"
                  tabIndex={0}
                  aria-label="No template attached — open this workspace to attach one"
                  style={{ cursor: "pointer", width: "fit-content" }}
                  onClick={goToChangeTemplate}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      goToChangeTemplate();
                    }
                  }}
                >
                  No template — attach one
                </Tag>
              ) : null}
            </Space>
          );
        },
      },
      {
        title: "Mentor",
        key: "mentor",
        // `project.mentor` is the backend's naive "first FACULTY member" field, which picks a
        // co-mentor or reviewer over the real designated mentor whenever a workspace has both —
        // adminProjectUtils documents exactly this and the at-risk/submissions/team pages already
        // use the role-aware helper. Falls back to the naive field only when no member carries a
        // primary-mentor role.
        render: (_, project) => textOrDash(projectMentorMember(project)?.name || project?.mentor),
      },
      {
        title: "Status",
        key: "status",
        render: (_, project) => <Tag color={statusColor(projectStatus(project))}>{statusLabel(projectStatus(project))}</Tag>,
      },
      {
        title: "Progress",
        key: "progress",
        render: (_, project) => (
          <div style={{ minWidth: 140 }}>
            <Progress percent={projectProgress(project)} size="small" />
          </div>
        ),
      },
      {
        title: "Members",
        key: "members",
        render: (_, project) => projectMemberCount(project),
      },
      {
        title: "Action",
        key: "action",
        fixed: "right",
        render: (_, project) => {
          const projectId = project?.id ?? project?.slug ?? project?.numericId;
          return (
            <Space>
              {/* A <button> nested inside an <a> (the previous <Link><Button/></Link> pattern) is
                  invalid HTML and produced two separate keyboard tab-stops per row. A single
                  Button navigating via router.push is a real button, valid markup, one tab-stop. */}
              {/* A workspace no longer has a read-only detail page and a separate edit page: each
                  of its nine sections shows and edits itself, so "Open" lands on Summary, which is
                  where the title/status/schedule fields the old Edit button led to now live. */}
              <Button
                type="link"
                // Explicit ?from=, not relying on the fallback happening to be this list.
                onClick={() =>
                  router.push(`/college-admin/projects/workspaces/${encodeURIComponent(projectId || "")}/summary?from=workspaces`)
                }
              >
                Open
              </Button>
              <Popconfirm
                title="Archive this workspace?"
                description="The workspace will be marked archived but remains accessible for review."
                okText="Archive"
                okButtonProps={{ danger: true, loading: archivingId === projectId }}
                onConfirm={() => handleArchive(project)}
                disabled={isArchivedStatus(projectStatus(project))}
              >
                <Button
                  icon={<InboxOutlined />}
                  danger
                  loading={archivingId === projectId}
                  // The default "All" status filter still shows already-archived rows, and the
                  // backend has no re-archive guard — re-clicking Archive here would re-send
                  // "Project archived" notifications to every member and add a duplicate audit row.
                  disabled={isArchivedStatus(projectStatus(project))}
                >
                  Archive
                </Button>
              </Popconfirm>
            </Space>
          );
        },
      },
    ],
    [archivingId, collegeId]
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
            description="You must be assigned to a college before managing project workspaces."
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
          <h1 className="admin-list-page__title">Project workspaces</h1>
          <div className="admin-list-page__subtitle">Live projects, each run by a mentor with a team of students.</div>
        </div>
        <Space wrap>
          <Button type="primary" onClick={() => router.push("/college-admin/projects/workspaces/new")}>Create workspace</Button>
          <Button onClick={() => router.push("/college-admin/projects/workspaces/reassign-mentor")}>Bulk reassign mentor</Button>
          <Button onClick={() => router.push("/college-admin/projects/workspaces/deleted")}>Deleted workspaces</Button>
          {/* No "Back to projects": the Projects overview page is gone (it only restated its own
              sibling tabs), and the tab strip above is already the way back to everything else.
              Bulk reassign moved here from its own tab — it is an action on these workspaces, not
              somewhere you browse to. */}
        </Space>
      </div>

      {error ? (
        <Alert type="error" message="Workspaces could not be loaded" description={error} showIcon style={{ marginBottom: 16 }} action={<Button size="small" onClick={() => setReloadKey((current) => current + 1)}>Retry</Button>} />
      ) : null}

      <Card
        title="Workspaces"
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
              placeholder="Status"
              className="admin-list-page__filter"
              value={status}
              onChange={setStatus}
              options={[
                { value: "ACTIVE", label: "Active" },
                { value: "IN_PROGRESS", label: "In progress" },
                { value: "READY", label: "Ready" },
                { value: "BLOCKED", label: "Blocked" },
                { value: "ARCHIVED", label: "Archived" },
              ]}
            />
            {/* This screen paginates server-side specifically because an unbounded fetch does not
                scale once a college has thousands of workspaces (see getProjectsByCollegePage's
                own comment) — so export is scoped to the current page rather than re-introducing
                that same unbounded fetch just to build a CSV. */}
            <Button
              size="small"
              icon={<DownloadOutlined />}
              disabled={!projects.length}
              onClick={() =>
                exportRowsToCsv(
                  "project-workspaces-page.csv",
                  // CAW-01: exportRowsToCsv(filename, columns, rows) needs a {label,key}[] columns
                  // array as its 2nd argument — this call was passing only the mapped rows, which
                  // landed in the columns slot and left `rows` undefined, so every "Export this
                  // page" click downloaded a header line of empty commas and zero data rows.
                  [
                    { label: "Workspace", key: "workspace" },
                    { label: "Status", key: "status" },
                    { label: "Progress", key: "progress" },
                    { label: "Mentor", key: "mentor" },
                    { label: "Template ID", key: "templateId" },
                  ],
                  projects.map((p) => ({
                    workspace: normaliseCollegeScopedName(p, "Workspace"),
                    // The derived values the table actually shows — the raw fields diverge from
                    // them (a row displaying 80% exported as 30), which makes the CSV silently
                    // disagree with the screen it was exported from.
                    status: statusLabel(projectStatus(p)),
                    progress: projectProgress(p),
                    mentor: projectMentorMember(p)?.name || p?.mentor || "",
                    templateId: p?.templateId ?? "",
                  }))
                )
              }
            >
              Export this page
            </Button>
          </Space>
        }
      >
        {/* The Skeleton replaces the table entirely while loading, so a `loading` prop on
            the Table below could never render — this is the only load indicator. */}
        <Skeleton loading={loading} active paragraph={{ rows: 6 }}>
          {error ? null : projects.length || totalRecords ? (
            <Table
              rowKey={(record) => String(record?.id ?? record?.slug ?? record?.numericId ?? record?.title)}
              dataSource={projects}
              columns={columns}
              scroll={{ x: "max-content" }}
              pagination={{
                current: pageNumber + 1,
                pageSize,
                total: totalRecords,
                showSizeChanger: true,
                pageSizeOptions: [10, 20, 50, 100],
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} workspaces`,
                onChange: (nextPage, nextPageSize) => {
                  setPageNumber(nextPage - 1);
                  setPageSize(nextPageSize);
                },
              }}
            />
          ) : (
            <Empty description={search || status ? "No workspaces match your search/filter" : "No workspaces available for this college"} />
          )}
        </Skeleton>
      </Card>
      </AdminGroupShell>
    </div>
  );
}

AdminProjectWorkspacesPage.adminLayout = AdminLayout;
