import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Alert, Button, Card, Empty, Input, Popconfirm, Progress, Select, Skeleton, Space, Table, Tag, message } from "antd";
import { showProjectError } from "@/utils/projectErrorModal";
import { InboxOutlined, DownloadOutlined } from "@ant-design/icons";
import { exportRowsToCsv } from "@/utils/csvExport";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminGroupShell from "@/components/admin/SuperAdminGroupShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";
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

function SuperAdminProjectWorkspacesPageBody() {
  const router = useRouter();
  const { selectedCollegeId: collegeId, scopeLoaded } = useSuperAdminScope();
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
  // The full-card Skeleton swapping the entire table out on every debounced search keystroke was
  // a jarring "doubled" loading state once a first page had already rendered. Reserve the full
  // Skeleton for the true first load; every subsequent refetch keeps the existing rows visible
  // under the Table's own lighter loading overlay instead.
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Restore search/status/pagination from the URL on load, mirroring the ?fromMentorId= pattern
  // in reassign-mentor/index.js, so a shared/reloaded link lands back on the same filtered view.
  useEffect(() => {
    if (!router.isReady || hydratedFromUrl) return;
    const q = router.query;
    if (q.search !== undefined) setSearch(String(q.search));
    if (q.status !== undefined) setStatus(String(q.status));
    if (q.page !== undefined) setPageNumber(Number(q.page) || 0);
    if (q.pageSize !== undefined) setPageSize(Number(q.pageSize) || 20);
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

  // Switching college in the header previously left pageNumber/search/status pointing at
  // whatever the PREVIOUS college's list state was — an admin on page 6 of college A who
  // switches to college B could silently land on an unrelated page (and filter) of B, only
  // saved by coincidence if B happened to have fewer pages than A. Reset to page 1 with cleared
  // filters whenever the selected college changes, but only after the URL-restored baseline is
  // captured (so a bookmarked ?page=4 for the college already selected on load survives the
  // very first render, mirroring the filtersBaselineRef pattern above).
  const collegeBaselineRef = useRef(null);
  useEffect(() => {
    if (!hydratedFromUrl) return;
    if (collegeBaselineRef.current === null) {
      collegeBaselineRef.current = collegeId;
      return;
    }
    if (collegeId === collegeBaselineRef.current) return;
    collegeBaselineRef.current = collegeId;
    setPageNumber(0);
    setSearch("");
    setStatus(undefined);
  }, [collegeId, hydratedFromUrl]);

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

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      // Without this gate, a bookmarked/shared ?status=&page= deep link fetched page 1 of every
      // status (the pre-hydration defaults) for one render cycle, then fetched again once
      // hydration copied the real filters/page in a moment later — a visible flash of the wrong
      // rows plus a discarded round-trip. selectedCollegeId can already be populated (restored
      // from localStorage) well before router.isReady/hydration land, so collegeId alone isn't
      // enough to gate on.
      if (!collegeId || !hydratedFromUrl) return;
      setLoading(true);
      setError(null);
      try {
        const result = await fetchWithErrorHandling(
          getProjectsByCollegePage(collegeId, { status, search: search || undefined, page: pageNumber, size: pageSize })
        );
        if (!mounted) return;
        if (result.success) {
          // fetchWithErrorHandling already unwraps response.data.data ?? response.data into
          // result.data; unwrapApiItem(result) then re-applies the same unwrap logic to `result`
          // itself (not `result.data`). This only resolves correctly because result.data.data is
          // undefined and it falls through to result.data — a coincidental, not designed,
          // composition of the two helpers. Left as-is rather than changing unwrapApiItem's
          // contract, since that helper is called this same way across most of the admin Projects
          // pages and changing it is a much wider-blast-radius fix than this one call site
          // warrants; flagging the landmine here for the next person who touches either helper.
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
            setPageNumber(Math.max(Math.ceil(total / pageSize) - 1, 0));
          }
        } else {
          setProjects([]);
          setTotalRecords(0);
          setError(result?.message || "Failed to load project workspaces.");
        }
      } catch (e) {
        if (!mounted) return;
        setProjects([]);
        setTotalRecords(0);
        setError(e?.message || "Failed to load project workspaces.");
      } finally {
        if (mounted) {
          setLoading(false);
          setHasLoadedOnce(true);
        }
      }
    };
    const timeout = setTimeout(load, search ? 350 : 0);
    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [collegeId, hydratedFromUrl, search, status, pageNumber, pageSize, reloadKey]);

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
          const goToChangeTemplate = () => router.push(`/superadmin/projects/workspaces/${encodeURIComponent(projectId || "")}/summary?openTemplate=1&from=workspaces`);
          return (
            <Space direction="vertical" size={2}>
              <Button
                type="link"
                style={{ padding: 0, height: "auto", textAlign: "left", whiteSpace: "normal" }}
                onClick={() => router.push(`/superadmin/projects/workspaces/${encodeURIComponent(projectId || "")}/summary?from=workspaces`)}
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
              {/* Open lands on the workspace's Summary section. There is no separate "Edit"
                  destination any more: each of the nine sections shows and edits its own
                  concern, so a second button pointing at the same place would just be noise. */}
              <Button
                type="link"
                // Explicit ?from=, not relying on the fallback happening to be this list.
                onClick={() =>
                  router.push(`/superadmin/projects/workspaces/${encodeURIComponent(projectId || "")}/summary?from=workspaces`)
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
        {/* Inside the shell: a missing scope is a state to recover from, and dropping the tab
            strip and every other navigation affordance is the one thing that makes it harder. */}
        <SuperAdminGroupShell groupKey="projects">
          {scopeLoaded ? (
            <Alert
              type="warning"
              message="No college selected"
              description="Pick a college in the header to manage its project workspaces."
              showIcon
            />
          ) : (
            <Skeleton active paragraph={{ rows: 4 }} />
          )}
        </SuperAdminGroupShell>
      </div>
    );
  }

  return (
    <div className="ln-module admin-list-page">
      <SuperAdminGroupShell groupKey="projects">
      <div className="admin-list-page__header">
        <div>
          <h1 className="admin-list-page__title">Project workspaces</h1>
          <div className="admin-list-page__subtitle">Live projects, each run by a mentor with a team of students.</div>
        </div>
        <Space wrap>
          <Button type="primary" onClick={() => router.push("/superadmin/projects/workspaces/new")}>
            Create workspace
          </Button>
          <Button onClick={() => router.push("/superadmin/projects/workspaces/reassign-mentor")}>
            Bulk reassign mentor
          </Button>
          <Button onClick={() => router.push("/superadmin/projects/workspaces/deleted")}>
            Deleted workspaces
          </Button>
          {/* No "Back to projects": the Projects overview page is gone (it only restated its own
              sibling tabs), and the tab strip above is already the way back to everything else.
              Bulk reassign moved here from its own tab — it is an action on these workspaces, not
              somewhere you browse to. */}
        </Space>
      </div>

      {error ? (
        <Alert type="error" message="Workspaces could not be loaded" description={error} showIcon style={{ marginBottom: 16 }} action={<Button size="small" onClick={() => setReloadKey((value) => value + 1)}>Retry</Button>} />
      ) : null}

      <Card
        title="Workspaces"
        extra={
          <Space wrap>
            <Input.Search
              allowClear
              aria-label="Search title or slug"
              placeholder="Search title or slug"
              style={{ width: 240 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              allowClear
              aria-label="Filter by status"
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
                  // SAW-01: exportRowsToCsv(filename, columns, rows) needs a {label,key}[] columns
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
        {/* The full Skeleton is reserved for the true first load. Once a page has rendered once,
            a subsequent refetch (e.g. a debounced search keystroke) keeps the existing rows
            visible and uses the Table's own lighter loading overlay instead of swapping the
            whole card body out again. */}
        <Skeleton loading={loading && !hasLoadedOnce} active paragraph={{ rows: 6 }}>
          {projects.length || totalRecords ? (
            <Table
              loading={hasLoadedOnce ? loading : false}
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
      </SuperAdminGroupShell>
    </div>
  );
}

// BE-0154/0155/0175/0176/0186: the page starts afresh for each college, so a header switch can't leave the last college's
// rows, selections, open dialogs or late answers on screen (or let a save act on them).
export default function SuperAdminProjectWorkspacesPage(props) {
  const { selectedCollegeId } = useSuperAdminScope();
  return <SuperAdminProjectWorkspacesPageBody key={selectedCollegeId ?? "none"} {...props} />;
}

SuperAdminProjectWorkspacesPage.superAdminLayout = SuperAdminLayout;
