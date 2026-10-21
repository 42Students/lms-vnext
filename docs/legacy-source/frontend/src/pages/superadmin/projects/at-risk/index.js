import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Button, Card, Col, Empty, Input, Row, Skeleton, Space, Statistic, Table, Tag, Typography } from "antd";
import { ClockCircleOutlined, DownloadOutlined, EditOutlined, FileTextOutlined, SearchOutlined, WarningOutlined } from "@ant-design/icons";
import { exportRowsToCsv } from "@/utils/csvExport";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminGroupShell from "@/components/admin/SuperAdminGroupShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";
import { fetchWithErrorHandling, getProjectsByCollegePage } from "@/api/Services/AdminService";
import {
  ageColor,
  ageLabel,
  asArray,
  countBy,
  hasProjectBlocker,
  isArchivedStatus,
  isProjectAtRisk,
  isProjectStalled,
  normaliseCollegeScopedName,
  projectMentorMember,
  projectNeedsReview,
  projectRiskReasons,
  projectStaleDays,
  projectStatus,
  riskSeverity,
  statusColor,
  statusLabel,
  textOrDash,
  unwrapApiItem,
} from "@/components/admin/projects/adminProjectUtils";

const { Text } = Typography;

// projectRiskReasons/projectStaleDays each walk a project's activity/members/status; an O(n log n)
// Table sorter calls its comparator many times per row, so calling them fresh on every pairwise
// comparison redoes that work repeatedly instead of once per row. WeakMap-keyed on the project
// object caches per-render (results are inert if the project reference is unchanged) without
// restructuring the row data.
const riskReasonsCache = new WeakMap();
const cachedRiskReasons = (project) => {
  if (!project) return [];
  if (!riskReasonsCache.has(project)) riskReasonsCache.set(project, projectRiskReasons(project));
  return riskReasonsCache.get(project);
};
const staleDaysCache = new WeakMap();
const cachedStaleDays = (project) => {
  if (!project) return null;
  if (!staleDaysCache.has(project)) staleDaysCache.set(project, projectStaleDays(project));
  return staleDaysCache.get(project);
};

// Each signal is also a server view with the same rule, so a card filters (and counts) every flagged workspace in the
// college, not just the 25 rows on this page (Projects audit R6-04).
const QUICK_FILTERS = [
  { key: "stalled", label: "Stalled", match: isProjectStalled, icon: <ClockCircleOutlined />, view: "AT_RISK_STALLED" },
  { key: "blocker", label: "Active blocker", match: hasProjectBlocker, icon: <WarningOutlined />, view: "AT_RISK_BLOCKER" },
  { key: "review", label: "Pending review", match: projectNeedsReview, icon: <FileTextOutlined />, view: "AT_RISK_REVIEW" },
];

export default function SuperAdminProjectAtRiskPage() {
  const router = useRouter();
  const { selectedCollegeId, scopeLoaded } = useSuperAdminScope();
  const collegeId = selectedCollegeId ?? null;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [quickFilter, setQuickFilter] = useState(null);
  const [search, setSearch] = useState("");
  // BE-0184: the five server queries follow the search only after typing pauses (300 ms), not on every keystroke;
  // the list on screen still narrows at once.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);
  const [projectPage, setProjectPage] = useState(0);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [signalCounts, setSignalCounts] = useState({ stalled: 0, blocker: 0, review: 0 });
  const [hydratedFromUrl, setHydratedFromUrl] = useState(false);

  // Restore the filter and search from the URL, and reflect them back into it. Every sibling list
  // in this group does this; without it, coming back here from a workspace via ?from=at-risk
  // landed on an unfiltered list — the loss the back target exists to prevent.
  useEffect(() => {
    if (!router.isReady || hydratedFromUrl) return;
    const q = router.query;
    if (q.filter !== undefined) setQuickFilter(String(q.filter) || null);
    if (q.search !== undefined) setSearch(String(q.search));
    setHydratedFromUrl(true);
  }, [router.isReady, hydratedFromUrl, router.query]);

  useEffect(() => {
    if (!hydratedFromUrl) return;
    router.replace(
      { pathname: router.pathname, query: Object.fromEntries(Object.entries({ ...router.query, filter: quickFilter || undefined, search: search || undefined }).filter(([, value]) => value !== undefined && value !== null && value !== "")) },
      undefined,
      { shallow: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickFilter, search, hydratedFromUrl]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!collegeId) return;
      setLoading(true);
      setError(null);
      try {
        const searchTerm = debouncedSearch.trim() || undefined;
        const signalView = quickFilter ? QUICK_FILTERS.find((option) => option.key === quickFilter)?.view : null;
        const countOf = (countView) => fetchWithErrorHandling(getProjectsByCollegePage(collegeId, { view: countView, page: 0, size: 1, search: searchTerm }));
        const [result, allSummary, ...signalSummaries] = await Promise.all([
          fetchWithErrorHandling(getProjectsByCollegePage(collegeId, { view: signalView || "AT_RISK", page: projectPage, size: 25, search: searchTerm })),
          countOf("AT_RISK"),
          ...QUICK_FILTERS.map((option) => countOf(option.view)),
        ]);
        if (!mounted) return;
        if (result.success && allSummary.success && signalSummaries.every((row) => row.success)) {
          const payload = unwrapApiItem(result) || {};
          setProjects(asArray(payload.records));
          setFilteredTotal(Number(payload.totalRecords) || 0);
          setTotalCandidates(Number(unwrapApiItem(allSummary)?.totalRecords) || 0);
          setSignalCounts(Object.fromEntries(QUICK_FILTERS.map((option, index) => [
            option.key, Number(unwrapApiItem(signalSummaries[index])?.totalRecords) || 0,
          ])));
        } else {
          setProjects([]);
          setTotalCandidates(0);
          setError(result?.message || "Failed to load project workspaces.");
        }
      } catch (e) {
        if (!mounted) return;
        setProjects([]);
        setError(e?.message || "Failed to load project workspaces.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [collegeId, projectPage, debouncedSearch, quickFilter]);
  useEffect(() => { setProjectPage(0); }, [collegeId, debouncedSearch, quickFilter]);

  const atRiskProjects = useMemo(
    () =>
      asArray(projects).filter((project) => !isArchivedStatus(projectStatus(project)) && isProjectAtRisk(project)),
    [projects]
  );

  // Counted off the at-risk set itself (not the whole college), so these tiles read as "of the
  // N workspaces flagged, here's the breakdown by reason" rather than a second, differently-scoped
  // total that would need its own explanation.
  const summary = signalCounts;

  // Must match what the Mentor column actually renders below (projectMentorMember(project)?.name
  // falling back to project?.mentor) — searching project?.mentor first would match/miss on the
  // backend's naive "first FACULTY member" name even when the table is showing the role-aware
  // mentor instead, and vice versa when they diverge (a Co-Mentor/Reviewer added before the real
  // "Project Mentor"-role member).
  const matchesSearch = (project, query) => {
    // Match what the column actually renders (normaliseCollegeScopedName prefers `title`, then
    // falls back through `name`/`projectTitle`/`templateTitle`/`courseLabel`/`course`), plus the
    // raw title — searching only `title` meant a row displayed via one of those fallbacks could
    // not be found by typing what's actually shown.
    const workspaceName = `${normaliseCollegeScopedName(project, "")} ${project?.title ?? ""}`.toLowerCase();
    const mentorName = String(projectMentorMember(project)?.name ?? project?.mentor ?? "").toLowerCase();
    return workspaceName.includes(query) || mentorName.includes(query);
  };

  const filteredProjects = useMemo(() => {
    // The signal filter already ran on the server; only the name/mentor search below is refined on this page.
    let list = atRiskProjects;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((project) => matchesSearch(project, q));
    }
    return list;
  }, [atRiskProjects, search]);

  const toggleQuickFilter = (key) => {
    setQuickFilter((prev) => (prev === key ? null : key));
  };

  const renderActions = (project) => {
    const projectId = project?.id ?? project?.slug ?? project?.numericId;
    const mentorId = projectMentorMember(project)?.userId;
    const needsReview = projectNeedsReview(project);
    // The workspace detail page's own risk banner recomputes from the detail-fetch endpoint,
    // which (unlike this page's list-fetch endpoint) includes resolvedActivity — so "stalled"
    // in particular can genuinely compute differently there. Carry what THIS page found as a
    // ?reason= so the detail page can show it even if its own live recomputation disagrees.
    const reasons = projectRiskReasons(project);
    // No id means no destination: the link used to build `/workspaces//summary`, which is a
    // different page entirely. Render the action disabled rather than pointing somewhere wrong.
    const openHref = projectId
      ? `/superadmin/projects/workspaces/${encodeURIComponent(projectId)}/summary?from=at-risk${reasons.length ? `&reason=${encodeURIComponent(reasons.join(", "))}` : ""}`
      : null;
    return (
      <Space size={4} wrap>
        {openHref ? (
          <Button type="link" size="small" onClick={() => router.push(openHref)}>
            Open
          </Button>
        ) : (
          <Button type="link" size="small" disabled title="This row has no workspace id">
            Open
          </Button>
        )}
        {mentorId ? (
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => router.push(`/superadmin/projects/workspaces/reassign-mentor?fromMentorId=${mentorId}`)}>
            Reassign mentor
          </Button>
        ) : (
          // A missing mentor is one of the most plausible root causes of a workspace showing up
          // here with no recent activity — don't leave the id-less case with no remediation
          // action while a stale/id-less "Open" gets an explicit fallback right above.
          // reassign-mentor's own fromMentorId hydration already treats an absent value as
          // "show all", so this is safe without a mentor id to scope it.
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => router.push("/superadmin/projects/workspaces/reassign-mentor")}>
            Assign mentor
          </Button>
        )}
        {needsReview ? (
          <Button type="link" size="small" icon={<FileTextOutlined />} onClick={() => router.push(`/superadmin/projects/submissions?tab=submitted&q=${encodeURIComponent(project?.title || "")}`)}>
            Review submission
          </Button>
        ) : null}
      </Space>
    );
  };

  const columns = [
    {
      title: "Workspace",
      key: "workspace",
      sorter: (a, b) => String(a?.title ?? "").localeCompare(String(b?.title ?? "")),
      render: (_, project) => normaliseCollegeScopedName(project, "Workspace"),
    },
    {
      title: "Mentor",
      key: "mentor",
      render: (_, project) => textOrDash(projectMentorMember(project)?.name || project?.mentor),
    },
    {
      title: "Status",
      key: "status",
      render: (_, project) => <Tag color={statusColor(projectStatus(project))}>{statusLabel(projectStatus(project))}</Tag>,
    },
    {
      title: "Severity",
      key: "severity",
      sorter: (a, b) => cachedRiskReasons(a).length - cachedRiskReasons(b).length,
      defaultSortOrder: "descend",
      render: (_, project) => {
        const severity = riskSeverity(project);
        return <Tag color={severity.color}>{severity.label}</Tag>;
      },
    },
    {
      title: "Risk reasons",
      key: "reasons",
      render: (_, project) => (
        <Space wrap size={[4, 4]}>
          {/* Match the adjacent Severity tag's scale (gold -> orange -> red) instead of always
              red — a single-reason row already reads "Watch" in gold right next to it; a hardcoded
              red chip here overstated urgency for that common case. */}
          {projectRiskReasons(project).map((reason) => (
            <Tag color={riskSeverity(project).color} key={reason}>
              {reason}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Inactive",
      key: "inactive",
      sorter: (a, b) => (cachedStaleDays(a) ?? -1) - (cachedStaleDays(b) ?? -1),
      render: (_, project) => {
        const days = projectStaleDays(project);
        if (days === null || !isProjectStalled(project)) return <Text type="secondary">—</Text>;
        return <Tag color={ageColor(days)}>{ageLabel(days)}</Tag>;
      },
    },
    {
      title: "Blocker",
      key: "blocker",
      render: (_, project) => textOrDash(project?.blocker),
    },
    {
      title: "Actions",
      key: "action",
      render: (_, project) => renderActions(project),
    },
  ];

  if (!collegeId) {
    return (
      <div className="ln-module admin-list-page">
        {/* SAR-02/SAR-03: was a bare Alert outside any shell, and it never read scopeLoaded — so
            it flashed "Select a college to continue" even when a previously-picked college was
            about to auto-restore from localStorage, and dropped the tab strip exactly when the
            admin most needed a way out of this page. Mirrors the workspaces/index.js sibling,
            which already got both of these right. */}
        <SuperAdminGroupShell groupKey="projects">
          {scopeLoaded ? (
            <Alert
              type="warning"
              message="Select a college to continue"
              description="Choose a college in the header above to see its at-risk projects."
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
          <h1 className="admin-list-page__title">At-risk projects</h1>
          <div className="admin-list-page__subtitle">
            {totalCandidates
              ? `${totalCandidates} workspace${totalCandidates === 1 ? "" : "s"} need attention (stalled, blocked, or waiting for review). Reason counts cover the whole college.`
              : "Workspaces with no recent activity, an active blocker, or a pending review."}
          </div>
        </div>
        {/* No header shortcut to bulk reassign: it lands unfiltered, where the per-row action
            below carries ?fromMentorId= and arrives with the right mentor already selected. Two
            entry points to one screen, one of them worse, and the label named a panel inside it
            rather than the page. Reassign lives on the Workspaces tab, where it belongs. */}
      </div>

      {error ? (
        <Alert type="error" message="Report could not be loaded" description={error} showIcon style={{ marginBottom: 16 }} />
      ) : null}

      <Skeleton loading={loading} active paragraph={{ rows: 8 }}>
        {/* SAR-cosmetic (found during the fix pass, same class as CAR-02 on the college-admin
            twin): this whole block used to render unconditionally, so a load failure showed the
            error Alert above AND a confident "No at-risk projects detected for this college"
            empty state right underneath it — an admin skimming past the alert could read the bold
            empty-state line as the actual takeaway. Suppress everything below once `error` is set;
            the Alert above already explains why there's nothing to show. */}
        {!error ? (
          <>
        {/* These three double as the page's only filter control (click to narrow the table below),
            so they don't duplicate a separate Tabs/Select the way a purely-informational stat row
            would. */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          {QUICK_FILTERS.map((bucket) => {
            const value = summary[bucket.key];
            const active = quickFilter === bucket.key;
            return (
              <Col xs={24} sm={12} md={8} key={bucket.key}>
                <Card
                  hoverable
                  role="button"
                  tabIndex={0}
                  aria-pressed={active}
                  onClick={() => toggleQuickFilter(bucket.key)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleQuickFilter(bucket.key);
                    }
                  }}
                  style={active ? { borderColor: "#0a7c88", boxShadow: "0 0 0 1px #0a7c88" } : undefined}
                >
                  <Statistic title={bucket.label} value={value} prefix={bucket.icon} />
                </Card>
              </Col>
            );
          })}
        </Row>

        <Card
          title="At-risk workspaces"
          extra={
            <Space wrap>
              <Input
                allowClear
                aria-label="Search workspace title or ID"
                placeholder="Search workspace title or ID"
                prefix={<SearchOutlined />}
                className="admin-list-page__filter"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button
                size="small"
                icon={<DownloadOutlined />}
                disabled={!filteredProjects.length}
                onClick={() =>
                  exportRowsToCsv(
                    // Exporting for college A, switching header scope, then exporting again for
                    // college B previously produced two downloads both literally named
                    // "at-risk-projects.csv" (the browser disambiguates with "(1)", "(2)" — the
                    // filename itself carried no college identifier). Stamp the college id and
                    // today's date, matching the pattern other exports in the app already use
                    // (e.g. Attendance.js's class/course/month-stamped filename).
                    `at-risk-projects-college-${collegeId}-${new Date().toISOString().slice(0, 10)}.csv`,
                    // SAR-01: exportRowsToCsv(filename, columns, rows) needs a {label,key}[]
                    // columns array as its 2nd argument — this call passed only the mapped rows,
                    // which landed in the columns slot and left `rows` undefined, so every export
                    // downloaded a header of empty commas and zero data.
                    [
                      { label: "Workspace", key: "workspace" },
                      { label: "Mentor", key: "mentor" },
                      { label: "Status", key: "status" },
                      { label: "Severity", key: "severity" },
                      { label: "Risk reasons", key: "reasons" },
                    ],
                    filteredProjects.map((p) => ({
                      workspace: normaliseCollegeScopedName(p, "Workspace"),
                      mentor: projectMentorMember(p)?.name || p?.mentor || "",
                      status: projectStatus(p),
                      severity: riskSeverity(p).label,
                      reasons: projectRiskReasons(p).join("; "),
                    }))
                  )
                }
              >
                Export CSV
              </Button>
            </Space>
          }
        >
          {quickFilter ? (
            <div style={{ marginBottom: 12 }}>
              <Tag closable onClose={() => setQuickFilter(null)} color="blue">
                {QUICK_FILTERS.find((option) => option.key === quickFilter)?.label}
              </Tag>
            </div>
          ) : null}
          {filteredProjects.length ? (
            <Table
              rowKey={(record) => String(record?.id ?? record?.slug ?? record?.numericId ?? record?.title)}
              dataSource={filteredProjects}
              columns={columns}
              pagination={{ current: projectPage + 1, pageSize: 25, total: filteredTotal, showSizeChanger: false, onChange: (page) => setProjectPage(page - 1) }}
              scroll={{ x: "max-content" }}
            />
          ) : (
            <Empty
              description={
                atRiskProjects.length ? "No at-risk workspaces match this filter" : "No at-risk projects detected for this college"
              }
            />
          )}
        </Card>
          </>
        ) : null}
      </Skeleton>
      </SuperAdminGroupShell>
    </div>
  );
}

SuperAdminProjectAtRiskPage.superAdminLayout = SuperAdminLayout;
