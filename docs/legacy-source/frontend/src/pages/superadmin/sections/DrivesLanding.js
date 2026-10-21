import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Row, Col, Card, Button, Tag, Typography, Empty, Spin, Input, Alert, Space, Modal, Dropdown, Badge, DatePicker, message } from "antd";
import { PlusOutlined, WarningOutlined, RightOutlined, CalendarOutlined, MoreOutlined, CopyOutlined, ReloadOutlined, DatabaseOutlined, DownOutlined, UpOutlined, FieldTimeOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import moment from "moment";
import { searchAdminJobs, getAdminNeedsAttentionSummary, getAdminDataRetentionReport, extendJobDeadline } from "@/api/Services/AdminService";
import dayjs from "dayjs";
import PlacementsCompanyAvatar from "@/components/Placements/PlacementsCompanyAvatar";
import JobForm from "./JobForm";
import StudentPlacementLookup from "./StudentPlacementLookup";
import PolicySettingField from "@/components/admin/PolicySettingField";
import { CardGridSkeleton, ListSkeleton, RefreshStatus } from "@/components/Common/Skeletons";
import { PanelEmpty } from "@/components/Common/PanelStates";
import { withReturnTo } from "@/utils/navigationContext";
import PlacementsPageOverview from "@/components/admin/placements/PlacementsPageOverview";

const { Text, Title } = Typography;

const ATTENTION_CATEGORIES = [
  { key: "staleApplications", label: "Applications with no action in a week", tab: "APPLIED" },
  { key: "unscheduledInterviews", label: "Marked Interview, nothing scheduled", tab: "INTERVIEW" },
  // Backend includes both OFFERED and HIRED (offer extended but letter never attached, even
  // after hire) in this category — there's no multi-status filter on the applications list page,
  // so land on the unfiltered "ALL" tab rather than a single-status filter that would silently
  // hide HIRED-without-offer-letter candidates from the click-through.
  { key: "missingOfferLetters", label: "Offered, no offer letter attached", tab: "ALL" },
  { key: "closingSoonLowConversion", label: "Closing soon, low conversion", tab: null },
];

function parseJobDate(raw) {
  if (!raw) return null;
  if (Array.isArray(raw) && raw.length >= 3) {
    const [y, mo, d] = raw;
    const m = moment({ year: y, month: (mo ?? 1) - 1, date: d ?? 1 });
    return m.isValid() ? m : null;
  }
  const m = moment.utc(raw).local();
  return m.isValid() ? m : null;
}

/**
 * Drives landing page — deliberately calm: a small capped "needs attention" queue up top (not
 * an exhaustive list), then active drive cards below. Closed/draft drives live behind "All
 * drives" rather than cluttering the default view, and the item count here stays roughly
 * constant regardless of whether the college has run 10 drives or 300.
 */
// basePath lets this same component be rendered from both the college-admin panel
// (/college-admin/jobs) and the superadmin panel (/superadmin/jobs) — every internal
// navigation must stay under whichever panel is currently rendering it, matching the pattern
// already established in Jobs.js/JobApplications.js for this exact module.
export default function DrivesLanding({ collegeId, basePath = "/college-admin" }) {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [activeTotal, setActiveTotal] = useState(0);
  const [allTotal, setAllTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [jobsError, setJobsError] = useState(null);
  const [jobsCollegeId, setJobsCollegeId] = useState(null);
  const [attention, setAttention] = useState(null);
  const [attentionLoading, setAttentionLoading] = useState(false);
  const [attentionError, setAttentionError] = useState(null);
  const searchText = Array.isArray(router.query?.q)
    ? (router.query.q[0] || "")
    : String(router.query?.q || "");
  const [formVisible, setFormVisible] = useState(false);
  const [duplicateSource, setDuplicateSource] = useState(null);
  // Extending a deadline was always possible through the full edit form — applicationDeadline is
  // one of importantDates' entries — but only by opening the form, finding the row, and re-entering
  // a date. This is the one-click version of the same change.
  const [extendTarget, setExtendTarget] = useState(null);
  const [extendDate, setExtendDate] = useState(null);
  const [extendSaving, setExtendSaving] = useState(false);

  const handleExtendDeadline = async () => {
    if (!extendTarget || !extendDate) return;
    setExtendSaving(true);
    try {
      await extendJobDeadline(extendTarget.id, extendDate.format("YYYY-MM-DDTHH:mm:ss"), collegeId);
      message.success(`Deadline extended to ${extendDate.format("D MMM YYYY")}`);
      setExtendTarget(null);
      setExtendDate(null);
      fetchJobs();
      fetchAttention();
    } catch (e) {
      message.error(e?.response?.data?.message || "Could not extend the deadline");
    } finally {
      setExtendSaving(false);
    }
  };
  const [showAllAttention, setShowAllAttention] = useState({});
  const [retentionOpen, setRetentionOpen] = useState(false);
  const [retentionReport, setRetentionReport] = useState(null);
  const [retentionLoading, setRetentionLoading] = useState(false);
  const [retentionError, setRetentionError] = useState(null);
  const jobsAbortRef = useRef(null);
  const attentionAbortRef = useRef(null);

  // MEDIUM FIX (F1, this audit round): used to call getJobsByCollege (GET /api/v1/admin/jobs?collegeId=),
  // an unbounded fetch of the college's ENTIRE job history, on every mount — the exact problem
  // Jobs.js/all.js already fixed by moving to the paginated /search endpoint (see its own comment).
  // This landing page never got the same migration despite being the first page an admin sees.
  // Two lightweight calls: one bounded "active" page for the cards + that status's total count,
  // one size=1 "all" call purely to read totalElements so inactiveCount doesn't require loading
  // every closed/draft job either.
  const ACTIVE_DRIVES_PAGE_SIZE = 60;
  const fetchJobs = useCallback(async () => {
    if (!collegeId) return;
    jobsAbortRef.current?.abort();
    const ac = new AbortController();
    jobsAbortRef.current = ac;
    const signal = ac.signal;
    setLoading(true);
    setJobsError(null);
    try {
      const [activeRes, allRes] = await Promise.all([
        searchAdminJobs(collegeId, { status: "active", size: ACTIVE_DRIVES_PAGE_SIZE, sortBy: "postedDate", sortDir: "desc" }, { signal }),
        searchAdminJobs(collegeId, { status: "all", size: 1 }, { signal }),
      ]);
      if (signal.aborted) return;
      const activeData = activeRes?.data?.data ?? activeRes?.data;
      const allData = allRes?.data?.data ?? allRes?.data;
      setJobs(Array.isArray(activeData?.content) ? activeData.content : []);
      setActiveTotal(Number(activeData?.totalElements ?? 0));
      setAllTotal(Number(allData?.totalElements ?? 0));
      setJobsCollegeId(collegeId);
    } catch (e) {
      if (e?.name === "AbortError" || e?.name === "CanceledError") return;
      // A broken fetch must never read the same as "no active drives" — that's the one failure
      // mode this page can't afford, since the whole point of the landing page is trust.
      setJobsError(e?.response?.data?.message || "Couldn't load drives. Check your connection and retry.");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [collegeId]);

  const fetchAttention = useCallback(async () => {
    if (!collegeId) return;
    attentionAbortRef.current?.abort();
    const ac = new AbortController();
    attentionAbortRef.current = ac;
    const signal = ac.signal;
    setAttentionLoading(true);
    setAttentionError(null);
    try {
      const res = await getAdminNeedsAttentionSummary(collegeId, { signal });
      if (signal.aborted) return;
      if (res?.data?.status === "success") setAttention(res.data.data || null);
      else setAttentionError(res?.data?.message || "Couldn't check for anything that needs attention.");
    } catch (e) {
      if (e?.name === "AbortError" || e?.name === "CanceledError") return;
      setAttentionError(e?.response?.data?.message || "Couldn't check for anything that needs attention.");
    } finally {
      if (!signal.aborted) setAttentionLoading(false);
    }
  }, [collegeId]);

  useEffect(() => {
    fetchJobs();
    fetchAttention();
    return () => {
      jobsAbortRef.current?.abort();
      attentionAbortRef.current?.abort();
    };
  }, [fetchJobs, fetchAttention]);

  useEffect(() => {
    // Retention data is college-scoped and loaded lazily. Never carry one college's report into
    // another college merely because the disclosure stayed open.
    setRetentionOpen(false);
    setRetentionReport(null);
    setRetentionError(null);
  }, [collegeId]);

  // Fetched on demand only (expand click), not on mount — this report is a housekeeping check,
  // not part of the page's default "what needs a decision today" view.
  const fetchRetentionReport = useCallback(async () => {
    if (!collegeId) return;
    setRetentionLoading(true);
    setRetentionError(null);
    try {
      const res = await getAdminDataRetentionReport(collegeId, 180);
      const data = res?.data?.data ?? res?.data;
      setRetentionReport(data || null);
    } catch (e) {
      setRetentionError(e?.response?.data?.message || "Couldn't load the data retention report.");
    } finally {
      setRetentionLoading(false);
    }
  }, [collegeId]);

  const toggleRetentionReport = () => {
    const next = !retentionOpen;
    setRetentionOpen(next);
    if (next && !retentionReport && !retentionLoading) fetchRetentionReport();
  };

  // jobs is already server-filtered to active/non-draft (status: "active" in fetchJobs above), so
  // no client-side isDraft/isActive filtering is needed here anymore. Scope the cached rows to
  // the college that produced them so a college switch can never expose the previous tenant.
  const hasCurrentJobs = collegeId != null && String(jobsCollegeId) === String(collegeId);
  const activeJobs = hasCurrentJobs ? jobs : [];
  const initialJobsLoading = loading && !hasCurrentJobs;
  const jobsRefreshing = loading && hasCurrentJobs;
  const filteredActiveJobs = useMemo(() => activeJobs.filter((j) => {
    if (!searchText.trim()) return true;
    const q = searchText.trim().toLowerCase();
    return (j.jobTitle || "").toLowerCase().includes(q) || (j.companyName || "").toLowerCase().includes(q);
  }), [activeJobs, searchText]);
  const inactiveCount = Math.max(0, allTotal - activeTotal);

  const totalAttentionCount = attention
    ? ATTENTION_CATEGORIES.reduce((sum, c) => sum + Number(attention[c.key]?.count ?? 0), 0)
    : 0;

  const updateSearchQuery = useCallback((value) => {
    const next = { ...(router.query || {}) };
    const text = String(value || "");
    if (text.trim()) next.q = text;
    else delete next.q;
    router.replace(
      { pathname: router.pathname, query: next },
      undefined,
      { shallow: true, scroll: false }
    );
  }, [router]);

  const goToDrive = (jobId, statusTab) => {
    const target = statusTab
      ? `${basePath}/jobs/${jobId}/applications?status=${statusTab}`
      : `${basePath}/jobs/${jobId}`;
    router.push(withReturnTo(target, router.asPath));
  };

  const attentionCountByJobId = useMemo(() => {
    const map = new Map();
    if (attention) {
      ATTENTION_CATEGORIES.forEach((c) => {
        (attention[c.key]?.items || []).forEach((item) => {
          map.set(item.jobId, (map.get(item.jobId) || 0) + 1);
        });
      });
    }
    return map;
  }, [attention]);

  return (
    <div>
      <PlacementsPageOverview
        title="Placement Drives"
        description="Run active hiring drives from one operational view. Attention items surface decisions that need action; closed and draft drives remain available in the full archive."
        metrics={[
          { label: "Active drives", value: activeTotal },
          { label: "Needs attention", value: attentionLoading ? "…" : totalAttentionCount },
          { label: "Closed / draft", value: inactiveCount },
          { label: "All drives", value: allTotal },
        ]}
        actions={
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setFormVisible(true)}>New drive</Button>
            <Button onClick={() => router.push(`${basePath}/jobs/all`)}>All drives</Button>
          </Space>
        }
      />
      {/* GLOBAL, not per-college — a superadmin-only card, hidden entirely for college-admins
          (basePath="/college-admin") since they can't write GLOBAL settings anyway. */}
      {basePath === "/superadmin" && (
        <Card size="small" title="Placements policy" style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, color: "#888", fontSize: 12 }}>
            Platform-wide — clear the college selection in the header to edit.
          </div>
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <PolicySettingField
                scopeType="GLOBAL"
                settingKey="placement.applyRateLimitPerMinute"
                label="Job application rate limit"
                help="Max applications a learner can submit per minute, platform-wide. Was hardcoded 5/min — worth raising temporarily during a high-traffic drive window."
                defaultValue={5}
                min={1}
                max={100}
                suffix="/ min"
              />
            </Col>
            <Col xs={24} md={12}>
              <PolicySettingField
                scopeType="GLOBAL"
                settingKey="interview.overlapWindowMinutes"
                label="Interview overlap window"
                help="Fallback duration (minutes) used for overlap checks when an interview has no explicit duration set. Was hardcoded 60."
                defaultValue={60}
                min={5}
                max={480}
                suffix="min"
              />
            </Col>
            <Col xs={24} md={12}>
              <PolicySettingField
                scopeType="GLOBAL"
                settingKey="interview.overlapBufferMinutes"
                label="Interview buffer"
                help="Gap required after one interview ends before the same learner/application/interviewer can be booked again. Was hardcoded 15."
                defaultValue={15}
                min={0}
                max={120}
                suffix="min"
              />
            </Col>
            <Col xs={24} md={12}>
              <PolicySettingField
                scopeType="GLOBAL"
                settingKey="interview.durationMinMinutes"
                label="Interview duration — minimum"
                help="Shortest duration allowed when scheduling an interview. Was hardcoded 15."
                defaultValue={15}
                min={1}
                max={480}
                suffix="min"
              />
            </Col>
            <Col xs={24} md={12}>
              <PolicySettingField
                scopeType="GLOBAL"
                settingKey="interview.durationMaxMinutes"
                label="Interview duration — maximum"
                help="Longest duration allowed when scheduling an interview. Was hardcoded 480."
                defaultValue={480}
                min={1}
                max={1440}
                suffix="min"
              />
            </Col>
          </Row>

          {/* Part A "Placement policy: set hiring-dashboard alert rules". These four decide what
              lands in the Needs attention panel directly below, and were all hardcoded. */}
          <div style={{ marginTop: 8, marginBottom: 8, fontWeight: 600 }}>Needs-attention alert rules</div>
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <PolicySettingField
                scopeType="GLOBAL"
                settingKey="placement.staleAppliedDays"
                label="Stale application after"
                help="An application still sitting in APPLIED with no admin action for this long is flagged as stale. Was hardcoded 7 days."
                defaultValue={7}
                min={1}
                max={90}
                suffix="days"
              />
            </Col>
            <Col xs={24} md={12}>
              <PolicySettingField
                scopeType="GLOBAL"
                settingKey="placement.closingSoonDays"
                label="Closing-soon window"
                help="A drive whose deadline falls within this window counts as closing soon. A college running month-long drives wants a wider window than one running week-long drives. Was hardcoded 3 days."
                defaultValue={3}
                min={1}
                max={60}
                suffix="days"
              />
            </Col>
            <Col xs={24} md={12}>
              <PolicySettingField
                scopeType="GLOBAL"
                settingKey="placement.needsAttentionSampleCap"
                label="Items shown per alert category"
                help="How many example rows each Needs-attention category lists. The panel is deliberately a short list of things to act on, not a full dump. Was hardcoded 5."
                defaultValue={5}
                min={1}
                max={50}
              />
            </Col>
            <Col xs={24} md={12}>
              <PolicySettingField
                scopeType="GLOBAL"
                settingKey="placement.lowConversionThreshold"
                label="Low-conversion threshold"
                help="A closing-soon drive converting below this rate (shortlisted-or-further ÷ applied) gets flagged. Stored as a fraction, so 0.15 means 15%. Was hardcoded 0.15."
                defaultValue={0.15}
                min={0}
                max={1}
                step={0.01}
              />
            </Col>
          </Row>
        </Card>
      )}
      {/* Needs attention — capped, not exhaustive. This is the whole point: a handful of things
          that actually need a decision today, not a dump of every stale row in the system. */}
      {attentionLoading ? (
        <Card size="small" style={{ marginBottom: 16 }}>
          <ListSkeleton rows={3} avatar={false} label="Checking drives that need attention" />
        </Card>
      ) : attentionError ? (
        <Alert
          type="error"
          showIcon
          message={attentionError}
          action={<Button size="small" icon={<ReloadOutlined />} onClick={fetchAttention}>Retry</Button>}
          style={{ marginBottom: 16 }}
        />
      ) : totalAttentionCount === 0 ? (
        <Alert type="success" showIcon message="No drives currently flagged in this view." style={{ marginBottom: 16 }} />
      ) : (
        <Card
          size="small"
          title={<Space><WarningOutlined style={{ color: "#ad6800" }} /> <Text strong style={{ fontSize: 15 }}>Needs attention ({totalAttentionCount})</Text></Space>}
          style={{ marginBottom: 16, borderLeft: "4px solid #faad14", background: "#fff1b8", boxShadow: "0 1px 4px rgba(250,173,20,0.25)" }}
        >
          {ATTENTION_CATEGORIES.map((cat) => {
            const data = attention?.[cat.key];
            const count = Number(data?.count ?? 0);
            if (count === 0) return null;
            const items = data?.items || [];
            const expanded = showAllAttention[cat.key];
            const visibleItems = expanded ? items : items.slice(0, 3);
            return (
              <div key={cat.key} style={{ marginBottom: 12 }}>
                <Text strong style={{ fontSize: 13 }}>{cat.label} ({count})</Text>
                <div style={{ marginTop: 4 }}>
                  {visibleItems.map((item, idx) => (
                    <div
                      key={`${item.jobId}-${item.applicationId ?? idx}`}
                      role="button"
                      tabIndex={0}
                      style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", cursor: "pointer" }}
                      onClick={() => goToDrive(item.jobId, cat.tab)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          goToDrive(item.jobId, cat.tab);
                        }
                      }}
                    >
                      <Text style={{ fontSize: 13 }}>
                        {item.learnerName ? `${item.learnerName} — ` : ""}{item.jobTitle}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>{item.detail} <RightOutlined style={{ fontSize: 10 }} /></Text>
                    </div>
                  ))}
                  {/* items may be a capped/truncated list from the backend, so "+N more" must be
                      derived from count - items.length rather than assuming items is complete;
                      once items has caught up to count there's nothing more to reveal. */}
                  {count > items.length && count > visibleItems.length && (
                    <Button type="link" size="small" style={{ padding: 0, fontSize: 12 }} onClick={() => setShowAllAttention((prev) => ({ ...prev, [cat.key]: !expanded }))}>
                      {expanded ? "Show less" : `+${count - visibleItems.length} more`}
                    </Button>
                  )}
                  {count > items.length && expanded && (
                    <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 2 }}>
                      Showing top {items.length} of {count}
                    </Text>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <Title level={5} style={{ margin: 0 }}>
          Active drives ({activeTotal})
          {searchText.trim() && (
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 400, marginLeft: 8 }}>
              Showing {filteredActiveJobs.length} matching &ldquo;{searchText.trim()}&rdquo;
              {/* This search only runs over the ACTIVE_DRIVES_PAGE_SIZE most-recently-posted
                  active drives loaded onto this page (client-side filter, not a server search)
                  — a college with more than that silently couldn't find an older one. Disclose
                  it and point at the real search instead of staying silent about the gap. */}
              {activeTotal > jobs.length && (
                <>
                  {" — only searching the "}
                  {jobs.length}
                  {" most recent; "}
                  <a onClick={() => router.push({
                    pathname: `${basePath}/jobs/all`,
                    query: searchText.trim() ? { q: searchText.trim() } : {},
                  })}>search all drives</a>
                </>
              )}
            </Text>
          )}
        </Title>
        <Space wrap>
          <Input.Search
            placeholder="Search by drive or company"
            allowClear
            value={searchText}
            onChange={(e) => updateSearchQuery(e.target.value)}
            style={{ width: 240 }}
          />
          <Button icon={<PlusOutlined />} type="primary" onClick={() => setFormVisible(true)}>New Drive</Button>
        </Space>
      </div>

      {jobsRefreshing ? <RefreshStatus label="Refreshing active drives…" /> : null}
      {jobsError ? (
        <Alert
          type={hasCurrentJobs ? "warning" : "error"}
          showIcon
          message={hasCurrentJobs ? "Couldn't refresh active drives" : jobsError}
          description={hasCurrentJobs ? "Showing the last active drives loaded for this college." : undefined}
          action={<Button size="small" icon={<ReloadOutlined />} onClick={fetchJobs}>Retry</Button>}
          style={{ marginBottom: 16 }}
        />
      ) : null}
      {initialJobsLoading ? (
        <CardGridSkeleton cards={4} columns={4} compact label="Loading active drives" />
      ) : jobsError && !hasCurrentJobs ? null
      : filteredActiveJobs.length === 0 ? (
        <PanelEmpty
          title={searchText ? "No active drives match your search" : "No active drives yet"}
          description={
            searchText
              ? "Try a different drive or company name, or clear the current search."
              : "Create the first drive for this college when you're ready."
          }
          ctaLabel={searchText ? "Clear search" : "Create your first drive"}
          onCta={searchText ? () => updateSearchQuery("") : () => setFormVisible(true)}
        />
      ) : (
        <Row gutter={[16, 16]}>
          {filteredActiveJobs.map((job) => (
            <Col key={job.id} xs={24} sm={12} lg={8} xl={6}>
              <Card
                hoverable
                size="small"
                role="button"
                tabIndex={0}
                onClick={() => goToDrive(job.id)}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
                    e.preventDefault();
                    goToDrive(job.id);
                  }
                }}
                style={{ height: "100%", position: "relative" }}
              >
                <Space align="start" style={{ width: "100%" }}>
                  <PlacementsCompanyAvatar companyName={job.companyName} companyLogo={job.companyLogo} size={40} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <Text strong ellipsis style={{ display: "block", paddingRight: attentionCountByJobId.has(job.id) ? 28 : 0 }}>{job.jobTitle}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }} ellipsis>{job.companyName}</Text>
                  </div>
                  {attentionCountByJobId.has(job.id) && (
                    <Badge
                      count={attentionCountByJobId.get(job.id)}
                      title={`${attentionCountByJobId.get(job.id)} item(s) need attention on this drive`}
                      aria-label={`Drive status: ${attentionCountByJobId.get(job.id)} item(s) need attention`}
                      style={{ backgroundColor: "#faad14" }}
                    />
                  )}
                </Space>
                <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Tag color={(job.applicationCount ?? job.applicantCount ?? 0) > 0 ? "blue" : "default"} style={{ fontWeight: 600 }}>
                    {(job.applicationCount ?? job.applicantCount ?? 0)} applicants
                  </Tag>
                  <Space size={4}>
                    {job.applicationDeadline && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <CalendarOutlined /> {parseJobDate(job.applicationDeadline)?.format("DD MMM") ?? "—"}
                      </Text>
                    )}
                    <Dropdown
                      trigger={["click"]}
                      menu={{
                        items: [
                          { key: "duplicate", icon: <CopyOutlined />, label: "Duplicate as new drive" },
                          { key: "extend", icon: <FieldTimeOutlined />, label: "Extend deadline" },
                        ],
                        onClick: ({ key, domEvent }) => {
                          domEvent.stopPropagation();
                          if (key === "duplicate") setDuplicateSource(job);
                          if (key === "extend") {
                            setExtendTarget(job);
                            const current = parseJobDate(job.applicationDeadline);
                            setExtendDate(current && current.isAfter(dayjs()) ? current : dayjs().add(7, "day").endOf("day"));
                          }
                        },
                      }}
                    >
                      <Button type="text" size="small" icon={<MoreOutlined />} aria-label="More actions" onClick={(e) => e.stopPropagation()} />
                    </Dropdown>
                  </Space>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <div style={{ marginTop: 24, textAlign: "center" }}>
        <Button type="link" onClick={() => router.push(`${basePath}/jobs/all`)}>
          All drives{inactiveCount > 0 ? ` (including ${inactiveCount} closed/draft)` : ""} <RightOutlined />
        </Button>
      </div>

      {/* Read-only housekeeping check, collapsed by default — doesn't delete anything, just
          surfaces stale rejected/withdrawn applications older than the threshold so an admin can
          decide whether to act on them elsewhere. */}
      <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid #f0f0f0" }}>
        <Button type="text" onClick={toggleRetentionReport} icon={<DatabaseOutlined />} style={{ paddingLeft: 0 }}>
          Data retention report {retentionOpen ? <UpOutlined style={{ fontSize: 10 }} /> : <DownOutlined style={{ fontSize: 10 }} />}
        </Button>
        {retentionOpen && (
          <Card size="small" style={{ marginTop: 8 }}>
            {retentionLoading ? (
              <ListSkeleton rows={3} avatar={false} label="Loading data retention report" />
            ) : retentionError ? (
              <Alert
                type="error"
                showIcon
                message={retentionError}
                action={<Button size="small" icon={<ReloadOutlined />} onClick={fetchRetentionReport}>Retry</Button>}
              />
            ) : retentionReport ? (
              <>
                <Text>
                  <Text strong>{retentionReport.totalStaleCount ?? 0}</Text> rejected/withdrawn application(s) with no
                  activity in the last {retentionReport.thresholdDays ?? 180} days.
                </Text>
                {(retentionReport.sample || []).length > 0 && (
                  <div style={{ marginTop: 12, maxHeight: 260, overflowY: "auto" }}>
                    {retentionReport.sample.map((row) => (
                      <div
                        key={row.applicationId}
                        style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f5f5f5", fontSize: 13 }}
                      >
                        <Text ellipsis style={{ maxWidth: "60%" }}>{row.jobTitle}</Text>
                        <Text type="secondary">
                          {row.applicationStatus} · {parseJobDate(row.lastActivityAt)?.format("DD MMM YYYY") ?? "—"}
                        </Text>
                      </div>
                    ))}
                    {retentionReport.sampleTruncatedAt200 && (
                      <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 8 }}>
                        Showing first 200 of {retentionReport.totalStaleCount} — sample truncated.
                      </Text>
                    )}
                  </div>
                )}
              </>
            ) : null}
          </Card>
        )}
      </div>

      {/* Secondary utility, moved below the drives it's often used alongside — it used to sit
          above the needs-attention queue, competing with the actual priority signal for
          first-glance attention. */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #f0f0f0" }}>
        <StudentPlacementLookup key={collegeId ?? "none"} collegeId={collegeId} /* BE-0092 */ />
      </div>

      <Modal
        title={duplicateSource ? `Duplicate "${duplicateSource.jobTitle}"` : "Create Drive"}
        open={formVisible || duplicateSource != null}
        destroyOnClose
        onCancel={() => { setFormVisible(false); setDuplicateSource(null); }}
        footer={null}
        width={800}
        className="admin-list-page-modal"
      >
        <JobForm
          job={null}
          duplicateFrom={duplicateSource}
          collegeId={collegeId}
          onSuccess={() => { setFormVisible(false); setDuplicateSource(null); fetchJobs(); fetchAttention(); }}
          onCancel={() => { setFormVisible(false); setDuplicateSource(null); }}
        />
      </Modal>

      <Modal
        title={extendTarget ? `Extend deadline — ${extendTarget.jobTitle}` : "Extend deadline"}
        open={!!extendTarget}
        onCancel={() => { setExtendTarget(null); setExtendDate(null); }}
        onOk={handleExtendDeadline}
        okText="Extend"
        confirmLoading={extendSaving}
        destroyOnClose
      >
        <p>
          Current deadline:{" "}
          <strong>{parseJobDate(extendTarget?.applicationDeadline)?.format("D MMM YYYY, HH:mm") ?? "None set"}</strong>
        </p>
        <DatePicker
          showTime={{ format: "HH:mm" }}
          format="YYYY-MM-DD HH:mm"
          style={{ width: "100%" }}
          value={extendDate}
          onChange={setExtendDate}
          disabledDate={(d) => d && d.isBefore(dayjs().startOf("day"))}
        />
        <Text type="secondary" style={{ display: "block", marginTop: 12 }}>
          Updates the same &ldquo;Application deadline&rdquo; entry the full edit form shows
          under Important Dates — this is a shortcut to it, not a separate value.
        </Text>
      </Modal>
    </div>
  );
}
