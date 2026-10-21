/**
 * Shared Interview Calendar content - used by both Admin and Superadmin.
 * Renders a filterable list of interviews with desktop table and mobile cards.
 *
 * @param {number|null} organizationId - College/organization ID for fetching interviews
 * @param {Function} onViewApplications - (jobId, job, applicationId) => void - navigate to applications page, optionally scrolling to applicationId
 * @param {Object} router - Next.js router (for deep link jobId from query)
 * @param {string} [emptyMessage] - Custom message when no organization assigned
 * @param {boolean} [jobIdIsRouteScope] - true when `jobId` in the URL is this page's own scope
 *   (e.g. the drive-scoped Schedule tab, where the dynamic route segment fills it in and it should
 *   never appear as a clearable filter); false when this page is a general/global calendar where a
 *   `?jobId=` could arrive via deep link and must behave like any other visible, user-clearable filter.
 */
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import moment from "moment";
import {
  Alert,
  Button,
  Tag,
  Typography,
  Spin,
  Input,
  Empty,
  Table,
  Card,
  Select,
} from "antd";
import {
  ReloadOutlined,
  CalendarOutlined,
  RightOutlined,
  SearchOutlined,
  CloseOutlined,
  VideoCameraOutlined,
  EnvironmentOutlined,
  WarningOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { getInterviewsForOrganization } from "@/api/Services/interviewService";
import { exportRowsToCsv, columnsFromRows } from "@/utils/csvExport";
import { REFETCH_DEBOUNCE_MS } from "@/utils/constants";
import { downloadInterviewIcs } from "@/utils/icsExport";
import { computeConflictIds, describeConflictKinds } from "@/utils/interviewConflicts";
import { parsePlacementUtcDateTime } from "@/utils/placementDateTime";

const { Text } = Typography;

// HR was solid green and Managerial was solid orange — the same hues STATUS_CONFIG below uses
// for "Confirmed" (success/green) and "Reschedule" (warning/orange), so a green or orange chip
// in this column read as a status signal, not an interview-type signal. Moved off both hues.
const INTERVIEW_TYPE_COLORS = {
  SCREENING: { bg: "#26bac7", text: "#fff", label: "Screening" },
  TECHNICAL: { bg: "#3b87ad", text: "#fff", label: "Technical" },
  HR: { bg: "#722ed1", text: "#fff", label: "HR" },
  MANAGERIAL: { bg: "#ad6800", text: "#fff", label: "Managerial" },
  FINAL: { bg: "#1e363f", text: "#fff", label: "Final" },
};
const DEFAULT_COLOR = { bg: "#26bac7", text: "#fff", label: "Interview" };

// A fixed palette (not a random hash) so the same company always lands on the same color across
// renders/sessions — needed so "Infosys is always this blue" actually helps an admin scan a
// mixed-company table instead of the color being decorative noise.
const COMPANY_COLOR_PALETTE = ["blue", "purple", "cyan", "gold", "lime", "magenta", "volcano", "geekblue"];
function companyTagColor(companyName) {
  if (!companyName) return "default";
  let hash = 0;
  for (let i = 0; i < companyName.length; i++) hash = (hash * 31 + companyName.charCodeAt(i)) >>> 0;
  return COMPANY_COLOR_PALETTE[hash % COMPANY_COLOR_PALETTE.length];
}

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  ...Object.entries(INTERVIEW_TYPE_COLORS).map(([k, v]) => ({ value: k, label: v.label })),
];

const MODE_OPTIONS = [
  { value: "all", label: "All modes" },
  { value: "online", label: "Online" },
  { value: "inperson", label: "In-person" },
];

const SORT_OPTIONS = [
  { value: "date", label: "Date ↑ Earliest" },
  { value: "dateDesc", label: "Date ↓ Latest" },
  { value: "job", label: "Job title" },
  { value: "status", label: "Status" },
];

const STATUS_CONFIG = {
  SCHEDULED: { color: "processing", label: "Scheduled" },
  CONFIRMED: { color: "success", label: "Confirmed" },
  RESCHEDULE_REQUESTED: { color: "warning", label: "Reschedule" },
  COMPLETED: { color: "default", label: "Completed" },
  CANCELLED: { color: "error", label: "Cancelled" },
  NO_SHOW: { color: "error", label: "No Show" },
};

function formatScheduledDate(raw) {
  const m = parsePlacementUtcDateTime(raw);
  return m ? m.format("DD MMM YYYY, hh:mm A") : "—";
}

export default function InterviewCalendarContent({
  organizationId,
  onViewApplications,
  router,
  emptyMessage = "Assign this admin to an organization or college to view interviews.",
  // Shown when the org has genuinely zero interviews yet (not filtered down to zero) — distinct
  // from `emptyMessage`, which only covers the "no organization assigned" case. Reusing that one
  // here would tell an admin whose org IS assigned that it isn't, just because nothing's
  // scheduled yet.
  noResultsMessage = "No interviews scheduled yet.",
  // Distinguishes this instance from its sibling (drive-scoped Schedule tab vs. the global
  // Interviews tab) — without it, a screenshot of either page is identical, and an admin has to
  // remember which one they're looking at rather than being told.
  scopeLabel,
  // Only the drive-scoped page (interviews.js) owns its `jobId` — there it's the page's scope, not
  // a filter. Every other caller (global calendar pages) must default to false so a deep-linked
  // `?jobId=` is treated as a normal, visible, user-clearable filter instead of vanishing silently.
  jobIdIsRouteScope = false,
}) {
  const abortRef = useRef(null);
  const initialLoadRef = useRef(false);
  const lastFetchRef = useRef(0);

  const [allInterviews, setAllInterviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [searchQuery, setSearchQuery] = useState("");
  const [jobIdFilter, setJobIdFilter] = useState(null);
  const [routeJobId, setRouteJobId] = useState(null);
  const [conflictsOnly, setConflictsOnly] = useState(false);
  const [companyFilter, setCompanyFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchInterviews = useCallback(async () => {
    if (!organizationId) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;
    setLoading(true);
    setFetchError(null);
    try {
      const res = await getInterviewsForOrganization(organizationId, { signal });
      if (res?.data?.status === "success") {
        const list = res?.data?.data || [];
        setAllInterviews(list.filter((inv) => inv.scheduledDate));
        initialLoadRef.current = true;
        lastFetchRef.current = Date.now();
      } else {
        const msg = res?.data?.message || "Unable to load interviews. Please try again.";
        setFetchError(
          initialLoadRef.current ? `${msg} Data below may be outdated.` : msg
        );
        if (!initialLoadRef.current) setAllInterviews([]);
      }
    } catch (err) {
      if (err?.code === "ERR_CANCELED" || err?.name === "AbortError") return;
      const msg =
        err?.response?.data?.message ||
        "Unable to load interviews. Please try again.";
      setFetchError(
        initialLoadRef.current ? `${msg} Data below may be outdated.` : msg
      );
      if (!initialLoadRef.current) setAllInterviews([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchInterviews();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchInterviews]);

  useEffect(() => {
    const q = router?.query;
    const jid = q?.jobId != null ? parseInt(q.jobId, 10) : null;
    if (Number.isFinite(jid) && jid > 0) {
      setJobIdFilter(jid);
      // Only remember this as the page's own "route scope" (exempt from filter chip / Clear) on
      // the drive-scoped page. On a global calendar the same jobId is a real, clearable filter.
      if (jobIdIsRouteScope) setRouteJobId(jid);
    }
  }, [router?.query?.jobId, jobIdIsRouteScope]);

  // A filter chosen under one org/college context is meaningless (and silently yields zero
  // results) once the org changes, since the underlying options/data are rebuilt from the new
  // list — so every filter (not just company) must reset on org/college scope switch.
  useEffect(() => {
    setCompanyFilter("all");
    setDepartmentFilter("all");
    setStatusFilter("all");
    setTypeFilter("all");
    setModeFilter("all");
    setConflictsOnly(false);
    setSearchQuery("");
  }, [organizationId]);

  useEffect(() => {
    const onFocus = () => {
      if (!organizationId) return;
      if (Date.now() - lastFetchRef.current < REFETCH_DEBOUNCE_MS) return;
      fetchInterviews();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [organizationId, fetchInterviews]);

  // Cross-drive double-booking: with many concurrent drives, a student (or the same interviewer)
  // can be scheduled into overlapping slots across two different companies with nothing to catch
  // it today. Computed over the full unfiltered list so a conflict is never hidden by an active
  // filter, and only counts interviews that are still active (a cancelled slot can't conflict).
  // Logic lives in src/utils/interviewConflicts.js so InterviewForm/InterviewEditForm can reuse it
  // to warn before a conflicting slot is even submitted, instead of only showing up here after.
  const conflictIds = useMemo(() => computeConflictIds(allInterviews), [allInterviews]);

  const filteredAndSorted = useMemo(() => {
    let list = [...allInterviews];

    if (jobIdFilter != null) {
      list = list.filter((inv) => inv.job?.id === jobIdFilter);
    }

    if (conflictsOnly) {
      list = list.filter((inv) => conflictIds.has(inv.id));
    }

    if (departmentFilter !== "all") {
      list = list.filter(
        (inv) =>
          (inv.learner?.department || inv.learner?.departmentName || "") === departmentFilter
      );
    }

    if (companyFilter !== "all") {
      list = list.filter((inv) => (inv.job?.companyName || "") === companyFilter);
    }

    if (statusFilter === "active") {
      list = list.filter((inv) =>
        ["SCHEDULED", "CONFIRMED", "RESCHEDULE_REQUESTED"].includes(inv.interviewStatus)
      );
    } else if (statusFilter === "completed") {
      list = list.filter((inv) => inv.interviewStatus === "COMPLETED");
    } else if (statusFilter === "cancelled") {
      list = list.filter((inv) => inv.interviewStatus === "CANCELLED");
    }

    if (typeFilter !== "all") {
      list = list.filter((inv) => inv.interviewType === typeFilter);
    }

    if (modeFilter === "online") {
      list = list.filter((inv) => inv.interviewMode === "ONLINE");
    } else if (modeFilter === "inperson") {
      list = list.filter((inv) => inv.interviewMode === "OFFLINE");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((inv) => {
        const jobTitle = (inv.job?.jobTitle || "").toLowerCase();
        const company = (inv.job?.companyName || "").toLowerCase();
        const learner = (
          inv.learner?.name ||
          [inv.learner?.firstName, inv.learner?.lastName].filter(Boolean).join(" ") ||
          ""
        ).toLowerCase();
        return jobTitle.includes(q) || company.includes(q) || learner.includes(q);
      });
    }

    list.sort((a, b) => {
      if (sortBy === "date") {
        return (parsePlacementUtcDateTime(a.scheduledDate)?.valueOf() ?? 0) - (parsePlacementUtcDateTime(b.scheduledDate)?.valueOf() ?? 0);
      }
      if (sortBy === "dateDesc") {
        return (parsePlacementUtcDateTime(b.scheduledDate)?.valueOf() ?? 0) - (parsePlacementUtcDateTime(a.scheduledDate)?.valueOf() ?? 0);
      }
      if (sortBy === "job") {
        return (a.job?.jobTitle || "").localeCompare(b.job?.jobTitle || "");
      }
      if (sortBy === "status") {
        return (a.interviewStatus || "").localeCompare(b.interviewStatus || "");
      }
      return 0;
    });

    return list;
  }, [allInterviews, statusFilter, typeFilter, modeFilter, departmentFilter, sortBy, searchQuery, jobIdFilter, conflictsOnly, conflictIds, companyFilter]);

  // Reset to page 1 whenever any filter/search/sort input changes, so the Table doesn't strand
  // the user on a page beyond the newly-filtered result count (or silently show a mismatched
  // page of the new list).
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, typeFilter, modeFilter, departmentFilter, sortBy, searchQuery, jobIdFilter, conflictsOnly, companyFilter]);

  const departmentOptions = useMemo(() => {
    const depts = new Set();
    allInterviews.forEach((inv) => {
      const d = inv.learner?.department || inv.learner?.departmentName || "";
      if (d) depts.add(d);
    });
    return [
      { value: "all", label: "All departments" },
      ...[...depts].sort().map((d) => ({ value: d, label: d })),
    ];
  }, [allInterviews]);

  // The one dropdown a cross-drive view actually needs — without it, isolating one company meant
  // typing its name into free-text search, which also matches job title and candidate name.
  const companyOptions = useMemo(() => {
    const companies = new Set();
    allInterviews.forEach((inv) => {
      if (inv.job?.companyName) companies.add(inv.job.companyName);
    });
    return [
      { value: "all", label: "All companies" },
      ...[...companies].sort().map((c) => ({ value: c, label: c })),
    ];
  }, [allInterviews]);

  // A page whose entire reason for existing is "everything across every company" gave no sense
  // of how many companies or how busy today was — just a raw filtered count.
  const summaryStats = useMemo(() => {
    const companies = new Set();
    let today = 0;
    const startOfDay = moment().startOf("day");
    const endOfDay = moment().endOf("day");
    filteredAndSorted.forEach((inv) => {
      if (inv.job?.companyName) companies.add(inv.job.companyName);
      if (inv.scheduledDate) {
        const d = parsePlacementUtcDateTime(inv.scheduledDate);
        if (d?.isBetween(startOfDay, endOfDay)) today += 1;
      }
    });
    return { companies: companies.size, today };
  }, [filteredAndSorted]);

  // jobIdFilter set from the route is only exempt from "active filters" / Clear on the
  // drive-scoped page (jobIdIsRouteScope=true), where it's the page's own scope, not a
  // user choice. On a global calendar page a deep-linked jobId is always a real, visible,
  // user-clearable filter.
  const isUserJobFilter = jobIdIsRouteScope
    ? jobIdFilter != null && jobIdFilter !== routeJobId
    : jobIdFilter != null;

  // Label for the visible "Job" filter chip on global calendar pages, so a deep-linked jobId
  // narrowing the list is never silent.
  const jobFilterLabel = useMemo(() => {
    if (!isUserJobFilter || jobIdFilter == null) return null;
    const match = allInterviews.find((inv) => inv.job?.id === jobIdFilter);
    return match?.job?.jobTitle || `Job #${jobIdFilter}`;
  }, [isUserJobFilter, jobIdFilter, allInterviews]);

  const hasActiveFilters =
    searchQuery.trim() ||
    statusFilter !== "all" ||
    typeFilter !== "all" ||
    modeFilter !== "all" ||
    departmentFilter !== "all" ||
    companyFilter !== "all" ||
    isUserJobFilter ||
    conflictsOnly;

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
    setModeFilter("all");
    setDepartmentFilter("all");
    setCompanyFilter("all");
    // On the drive-scoped page, clearing must restore the page's own route scope, not wipe it.
    // On a global calendar page, the jobId is a normal filter and clears to null like any other.
    setJobIdFilter(jobIdIsRouteScope ? routeJobId : null);
    setConflictsOnly(false);
  }, [routeJobId, jobIdIsRouteScope]);

  const handleDownloadIcs = useCallback((record) => {
    const titleParts = [record.interviewType ? INTERVIEW_TYPE_COLORS[record.interviewType]?.label : null, record.job?.jobTitle, record.job?.companyName].filter(Boolean);
    downloadInterviewIcs({
      title: titleParts.join(" — ") || "Interview",
      startDate: record.scheduledDate,
      durationMinutes: record.durationMinutes,
      location: record.location,
      description: record.interviewerName ? `Interviewer: ${record.interviewerName}` : undefined,
    });
  }, []);

  const tableColumns = useMemo(
    () => [
      {
        title: (
          <span className="admin-interview-table__col-header">
            <span>Job</span>
            <Input
              placeholder="Search..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              size="small"
              className="admin-interview-table__col-search"
              onClick={(e) => e.stopPropagation()}
            />
          </span>
        ),
        key: "job",
        dataIndex: ["job", "jobTitle"],
        width: 220,
        ellipsis: true,
        render: (_, record) => (
          <div className="admin-interview-table__job-cell">
            <span className="admin-interview-table__job-title">
              {record.job?.jobTitle || "—"}
            </span>
            {record.job?.companyName && (
              <Tag color={companyTagColor(record.job.companyName)} style={{ marginTop: 2 }}>
                {record.job.companyName}
              </Tag>
            )}
          </div>
        ),
      },
      {
        title: (
          <span className="admin-interview-table__col-header admin-interview-table__col-header--filter">
            <span>Candidate</span>
            {departmentOptions.length > 1 && (
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="admin-interview-table__col-select"
                aria-label="Filter by department"
              >
                {departmentOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}
          </span>
        ),
        key: "learner",
        dataIndex: ["learner", "name"],
        width: 160,
        ellipsis: true,
        render: (_, record) => {
          const name =
            record.learner?.name ||
            [record.learner?.firstName, record.learner?.lastName].filter(Boolean).join(" ") ||
            "—";
          const dept =
            record.learner?.department || record.learner?.departmentName || "";
          return (
            <div>
              <div>{name}</div>
              {dept && (
                <div style={{ fontSize: 12, color: "#8c8c8c" }}>{dept}</div>
              )}
            </div>
          );
        },
      },
      {
        title: (
          <span className="admin-interview-table__col-header admin-interview-table__col-header--filter">
            <span>Type</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="admin-interview-table__col-select"
              aria-label="Filter by type"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </span>
        ),
        key: "type",
        dataIndex: "interviewType",
        width: 120,
        render: (type) => {
          const cfg = INTERVIEW_TYPE_COLORS[type] || DEFAULT_COLOR;
          return (
            <Tag color={cfg.bg} style={{ color: cfg.text, border: "none" }}>
              {cfg.label}
            </Tag>
          );
        },
      },
      {
        title: (
          <span className="admin-interview-table__col-header admin-interview-table__col-header--filter">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-interview-table__col-select"
              aria-label="Filter by status"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </span>
        ),
        key: "status",
        dataIndex: "interviewStatus",
        width: 130,
        render: (status) => {
          const cfg = STATUS_CONFIG[status] || { color: "default", label: status || "—" };
          return <Tag color={cfg.color}>{cfg.label}</Tag>;
        },
      },
      {
        title: "Date & Time",
        key: "date",
        dataIndex: "scheduledDate",
        width: 180,
        render: (d, record) => (
          <div>
            <div>{formatScheduledDate(d)}</div>
            {conflictIds.has(record.id) && (
              <Tag icon={<WarningOutlined />} color="error" style={{ marginTop: 2 }}>
                {describeConflictKinds(conflictIds.get(record.id))}
              </Tag>
            )}
          </div>
        ),
      },
      {
        title: "Duration",
        key: "duration",
        width: 90,
        render: (_, record) =>
          typeof record.durationMinutes === "number" && record.durationMinutes > 0
            ? `${record.durationMinutes} min`
            : "—",
      },
      {
        title: "Interviewer",
        key: "interviewer",
        dataIndex: "interviewerName",
        width: 140,
        ellipsis: true,
        render: (name) => name || <Text type="secondary">—</Text>,
      },
      {
        title: "Location",
        key: "location",
        dataIndex: "location",
        width: 160,
        ellipsis: true,
        render: (loc) => loc || <Text type="secondary">—</Text>,
      },
      {
        title: (
          <span className="admin-interview-table__col-header admin-interview-table__col-header--filter">
            <span>Mode</span>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="admin-interview-table__col-select"
              aria-label="Filter by mode"
            >
              {MODE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </span>
        ),
        key: "mode",
        dataIndex: "interviewMode",
        width: 100,
        render: (mode) =>
          mode === "ONLINE" ? (
            <Tag icon={<VideoCameraOutlined />}>Online</Tag>
          ) : (
            <Tag icon={<EnvironmentOutlined />}>In-person</Tag>
          ),
      },
      {
        title: "",
        key: "action",
        width: 120,
        fixed: "right",
        render: (_, record) => (
          <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <Button
              type="text"
              size="small"
              icon={<DownloadOutlined />}
              title="Download .ics"
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadIcs(record);
              }}
            />
            <Button
              type="link"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onViewApplications(record.job?.id, record.job, record.jobApplication?.id);
              }}
            >
              View <RightOutlined />
            </Button>
          </span>
        ),
      },
    ],
    [
      searchQuery,
      typeFilter,
      statusFilter,
      modeFilter,
      departmentFilter,
      departmentOptions,
      onViewApplications,
      conflictIds,
      handleDownloadIcs,
    ]
  );

  const renderMobileCard = (record) => {
    const typeCfg = INTERVIEW_TYPE_COLORS[record.interviewType] || DEFAULT_COLOR;
    const statusCfg = STATUS_CONFIG[record.interviewStatus] || {
      color: "default",
      label: record.interviewStatus || "—",
    };
    const learnerName =
      record.learner?.name ||
      [record.learner?.firstName, record.learner?.lastName].filter(Boolean).join(" ") ||
      "";

    return (
      <Card
        key={record.id}
        className="admin-interview-mobile-card"
      >
        <div className="admin-interview-mobile-card__header">
          <span className="admin-interview-mobile-card__title">
            {record.job?.jobTitle || "—"}
          </span>
          <Button
            type="link"
            size="small"
            className="admin-interview-mobile-card__view"
            aria-label={`View application for ${learnerName || "learner"} — ${record.job?.jobTitle || "job"}`}
            onClick={() => {
              onViewApplications(record.job?.id, record.job, record.jobApplication?.id);
            }}
          >
            View <RightOutlined />
          </Button>
        </div>
        {record.job?.companyName && (
          <Tag color={companyTagColor(record.job.companyName)} style={{ marginBottom: 4 }}>
            {record.job.companyName}
          </Tag>
        )}
        {learnerName && (
          <div className="admin-interview-mobile-card__learner">
            {learnerName}
          </div>
        )}
        <div className="admin-interview-mobile-card__meta">
          <Tag color={typeCfg.bg} style={{ color: typeCfg.text, border: "none" }}>
            {typeCfg === DEFAULT_COLOR ? typeCfg.label : `${typeCfg.label} interview`}
          </Tag>
          <Tag color={statusCfg.color}>{statusCfg.label}</Tag>
          {conflictIds.has(record.id) && (
            <Tag icon={<WarningOutlined />} color="error">{describeConflictKinds(conflictIds.get(record.id))}</Tag>
          )}
          <span className="admin-interview-mobile-card__date">
            {formatScheduledDate(record.scheduledDate)}
          </span>
        </div>
        {(record.interviewerName || record.location) && (
          <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 4 }}>
            {record.interviewerName && <div>Interviewer: {record.interviewerName}</div>}
            {record.location && <div>{record.location}</div>}
          </div>
        )}
        <div className="admin-interview-mobile-card__mode">
          {record.interviewMode === "ONLINE" ? (
            <Tag icon={<VideoCameraOutlined />} className="admin-interview-mobile-card__mode-tag">
              Online
            </Tag>
          ) : (
            <Tag icon={<EnvironmentOutlined />} className="admin-interview-mobile-card__mode-tag">
              In-person
            </Tag>
          )}
          <Button
            type="text"
            size="small"
            icon={<DownloadOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadIcs(record);
            }}
          >
            .ics
          </Button>
        </div>
      </Card>
    );
  };

  if (!organizationId) {
    return (
      <div className="admin-interviews-page admin-list-page">
        <div className="ln-module__head bg-white">
          <h1 className="h1 admin-list-page__title">Interviews</h1>
        </div>
        <div className="admin-interviews-empty-state">
          <Text type="secondary">{emptyMessage}</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-interviews-page admin-list-page">
      <div className="ln-module admin-interviews-module">
        <div className="ln-module__head admin-interviews-header bg-white">
          <div className="admin-interviews-header__top">
            <span>
              <h1 className="h1 admin-list-page__title" style={{ marginBottom: scopeLabel ? 0 : undefined }}>Interviews</h1>
              <Text type="secondary" className="admin-interviews-header__description">
                Review the interview schedule, conflicts and candidate context without leaving the placements workspace.
              </Text>
              {scopeLabel && <Text type="secondary" className="admin-interviews-header__scope">{scopeLabel}</Text>}
            </span>
            <Button
              type="default"
              icon={<ReloadOutlined />}
              onClick={fetchInterviews}
              loading={loading}
            >
              Refresh
            </Button>
          </div>
          <div className="admin-interviews-header__metrics" aria-label="Interview summary">
            <div><Text type="secondary">Scheduled</Text><strong>{allInterviews.length}</strong></div>
            <div><Text type="secondary">Today</Text><strong>{summaryStats.today}</strong></div>
            <div><Text type="secondary">Companies</Text><strong>{summaryStats.companies}</strong></div>
            <div><Text type="secondary">Conflicts</Text><strong>{conflictIds.size}</strong></div>
          </div>
        </div>

        <div className="ln-module__body admin-interviews-body">
          {fetchError && (
            <Alert
              type="warning"
              message={fetchError}
              showIcon
              closable
              onClose={() => setFetchError(null)}
              className="admin-interviews-alert"
            />
          )}

          {loading && filteredAndSorted.length === 0 ? (
            <div className="admin-interviews-loading">
              <Spin size="large" />
              <Text type="secondary">Loading interviews...</Text>
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="admin-interviews-empty-state">
              <Empty
                image={
                  <div className="admin-interviews-empty-icon">
                    <CalendarOutlined />
                  </div>
                }
                description={
                  // A brand-new drive with genuinely zero interviews yet used to get told "try
                  // adjusting filters" it never set — reads as broken, not encouraging. Only show
                  // that copy when a filter is actually narrowing an existing list.
                  <span>
                    {hasActiveFilters
                      ? "No interviews match your filters. Try adjusting filters or schedule interviews from the Jobs module."
                      : noResultsMessage}
                  </span>
                }
              />
            </div>
          ) : (
            <>
              {loading && (
                <div className="admin-interviews-refresh-overlay">
                  <Spin size="small" />
                </div>
              )}

              <div className="admin-interviews-toolbar">
                <Text type="secondary" className="admin-interviews-count">
                  {filteredAndSorted.length} interview{filteredAndSorted.length !== 1 ? "s" : ""}
                  {summaryStats.companies > 1 ? ` · ${summaryStats.companies} companies` : ""}
                  {summaryStats.today > 0 ? ` · ${summaryStats.today} today` : ""}
                </Text>
                {companyOptions.length > 2 && (
                  <span style={{ marginLeft: 8, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Company:</Text>
                    <select
                      value={companyFilter}
                      onChange={(e) => setCompanyFilter(e.target.value)}
                      className="admin-interview-table__col-select"
                      aria-label="Filter by company"
                    >
                      {companyOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </span>
                )}
                {jobFilterLabel && (
                  <Tag
                    closable
                    color="blue"
                    onClose={() => setJobIdFilter(null)}
                    style={{ marginLeft: 8 }}
                  >
                    Job: {jobFilterLabel}
                  </Tag>
                )}
                {/* A dedicated, clearly-labeled sort control in the toolbar — not a per-column
                    <select> sharing the same class/styling as the genuine Type/Status/Mode column
                    filters, which gave no visual cue that this one re-sorts the whole table
                    (even by unrelated fields) instead of narrowing it. */}
                <span
                  style={{ marginLeft: 8, display: "inline-flex", alignItems: "center", gap: 4 }}
                  className="admin-interviews-sort-control"
                >
                  <Text type="secondary" style={{ fontSize: 12 }}>Sort by:</Text>
                  <Select
                    value={sortBy}
                    onChange={setSortBy}
                    options={SORT_OPTIONS}
                    size="small"
                    style={{ minWidth: 150 }}
                    aria-label="Sort interviews"
                  />
                </span>
                <Button
                  size="small"
                  icon={<DownloadOutlined />}
                  disabled={!filteredAndSorted.length}
                  onClick={() => {
                    // exportRowsToCsv(filename, columns, rows) needs a {label,key}[] columns list
                    // — this used to call it with only (filename, rows), silently passing the row
                    // array in as `columns` and leaving `rows` undefined.
                    const rows = filteredAndSorted.map((r) => ({
                      id: r.id,
                      job: r.job?.jobTitle ?? "",
                      candidate: r.learner?.name ?? "",
                      type: r.interviewType ?? "",
                      status: r.interviewStatus ?? "",
                      scheduledDate: r.scheduledDate ?? "",
                      interviewer: r.interviewerName ?? "",
                      location: r.location ?? "",
                      mode: r.interviewMode ?? "",
                    }));
                    exportRowsToCsv("interviews.csv", columnsFromRows(rows), rows);
                  }}
                >
                  Export CSV
                </Button>
                {conflictIds.size > 0 && (
                  // A real double-booking is something to act on immediately, not a filter
                  // convenience on par with "Clear filters" — an amber/red chip reads as "needs
                  // attention" the way a plain text button next to a count never did.
                  <Button
                    type={conflictsOnly ? "primary" : "default"}
                    danger
                    size="small"
                    icon={<WarningOutlined />}
                    onClick={() => setConflictsOnly((v) => !v)}
                    style={conflictsOnly ? undefined : { background: "#fff2f0", borderColor: "#ffccc7" }}
                  >
                    {conflictIds.size} conflict{conflictIds.size !== 1 ? "s" : ""}
                  </Button>
                )}
                {hasActiveFilters && (
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={clearFilters}
                    className="admin-interviews-clear"
                  >
                    Clear filters
                  </Button>
                )}
              </div>

              <div className="admin-interviews-mobile">
                <div className="admin-interviews-mobile-filters">
                  <Input
                    placeholder="Search..."
                    prefix={<SearchOutlined />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    allowClear
                    size="middle"
                    className="admin-interviews-mobile-search"
                  />
                  <div className="admin-interviews-mobile-filters-row">
                    <Select
                      value={typeFilter}
                      onChange={setTypeFilter}
                      options={TYPE_OPTIONS}
                      className="admin-interviews-mobile-select"
                      size="middle"
                      placeholder="Type"
                      listHeight={180}
                      popupMatchSelectWidth={false}
                      dropdownStyle={{ width: 160, maxWidth: "90vw" }}
                      getPopupContainer={(n) => n?.parentElement || document.body}
                      dropdownClassName="admin-interviews-mobile-dropdown"
                    />
                    <Select
                      value={statusFilter}
                      onChange={setStatusFilter}
                      options={STATUS_OPTIONS}
                      className="admin-interviews-mobile-select"
                      size="middle"
                      placeholder="Status"
                      listHeight={180}
                      popupMatchSelectWidth={false}
                      dropdownStyle={{ width: 160, maxWidth: "90vw" }}
                      getPopupContainer={(n) => n?.parentElement || document.body}
                      dropdownClassName="admin-interviews-mobile-dropdown"
                    />
                    <Select
                      value={modeFilter}
                      onChange={setModeFilter}
                      options={MODE_OPTIONS}
                      className="admin-interviews-mobile-select"
                      size="middle"
                      placeholder="Mode"
                      listHeight={180}
                      popupMatchSelectWidth={false}
                      dropdownStyle={{ width: 160, maxWidth: "90vw" }}
                      getPopupContainer={(n) => n?.parentElement || document.body}
                      dropdownClassName="admin-interviews-mobile-dropdown"
                    />
                    {departmentOptions.length > 1 && (
                      <Select
                        value={departmentFilter}
                        onChange={setDepartmentFilter}
                        options={departmentOptions}
                        className="admin-interviews-mobile-select"
                        size="middle"
                        placeholder="Department"
                        listHeight={180}
                        popupMatchSelectWidth={false}
                        dropdownStyle={{ width: 200, maxWidth: "90vw" }}
                        getPopupContainer={(n) => n?.parentElement || document.body}
                        dropdownClassName="admin-interviews-mobile-dropdown"
                      />
                    )}
                    {companyOptions.length > 2 && (
                      <Select
                        value={companyFilter}
                        onChange={setCompanyFilter}
                        options={companyOptions}
                        className="admin-interviews-mobile-select"
                        size="middle"
                        placeholder="Company"
                        listHeight={180}
                        popupMatchSelectWidth={false}
                        dropdownStyle={{ width: 200, maxWidth: "90vw" }}
                        getPopupContainer={(n) => n?.parentElement || document.body}
                        dropdownClassName="admin-interviews-mobile-dropdown"
                      />
                    )}
                  </div>
                  {hasActiveFilters && (
                    <Button
                      type="text"
                      size="small"
                      onClick={clearFilters}
                      className="admin-interviews-mobile-clear"
                    >
                      Clear all
                    </Button>
                  )}
                </div>
                <div className="admin-interviews-mobile-cards">
                  {filteredAndSorted.map(renderMobileCard)}
                </div>
              </div>

              <div className="admin-interviews-desktop">
                <Table
                  columns={tableColumns}
                  dataSource={filteredAndSorted}
                  rowKey="id"
                  pagination={{
                    current: currentPage,
                    onChange: (page) => setCurrentPage(page),
                    pageSize: 20,
                    showSizeChanger: true,
                    showTotal: (total) => `${total} interviews`,
                    size: "default",
                    pageSizeOptions: ["10", "20", "50", "100"],
                  }}
                  scroll={{ x: 1100 }}
                  size="middle"
                  loading={loading}
                  onRow={(record) => ({
                    onClick: () => onViewApplications(record.job?.id, record.job, record.jobApplication?.id),
                    style: { cursor: "pointer" },
                  })}
                  className="admin-interview-table"
                  locale={{
                    emptyText: "No interviews",
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
