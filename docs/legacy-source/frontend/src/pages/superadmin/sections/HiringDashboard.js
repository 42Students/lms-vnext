/**
 * Phase 5 - Hiring Dashboard (Gaps 15.1, 15.2, 15.3, 15.4)
 * Metrics cards, funnel visualization, and company-wise report.
 * Supports placement (org-scoped) and college (college-scoped) views.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { Card, Row, Col, Space, Typography, DatePicker, Select, Button, Table, Alert, Statistic, Tag, Empty, theme } from "antd";
import { ReloadOutlined, DownloadOutlined } from "@ant-design/icons";
import {
  getPlacementHiringMetrics,
  getPlacementHiringFunnel,
  getPlacementCompanyReport,
} from "@/api/Services/placementJobService";
import {
  getAdminHiringMetrics,
  getAdminHiringFunnel,
  getAdminCompanyReport,
  getJobsByCollege,
  getDepartmentsByCollege,
  getProgramsByCollege,
  getBatchesByCollege,
} from "@/api/Services/AdminService";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { DashboardSkeleton, RefreshStatus } from "@/components/Common/Skeletons";
import PlacementsPageOverview from "@/components/admin/placements/PlacementsPageOverview";

const { RangePicker } = DatePicker;
const { Text } = Typography;

const STAGE_LABELS = {
  APPLIED: "Applied",
  SHORTLISTED: "Shortlisted",
  ASSESSMENT: "Assessment",
  INTERVIEW: "Interview",
  OFFERED: "Offered",
  HIRED: "Hired",
};

export default function HiringDashboard({ collegeId = null }) {
  const { token } = theme.useToken();
  const requestSeqRef = useRef(0);
  const [metrics, setMetrics] = useState(null);
  const [funnel, setFunnel] = useState([]);
  const [companyReport, setCompanyReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeScopeKey, setActiveScopeKey] = useState(null);
  const [loadedScopeKey, setLoadedScopeKey] = useState(null);
  // Read through a ref inside the fetch callback: as a dependency it rebuilt the callback after every load and
  // re-ran the effects that call it (a duplicate request, plus their resets).
  const loadedScopeKeyRef = useRef(loadedScopeKey);
  loadedScopeKeyRef.current = loadedScopeKey;
  const [errorScopeKey, setErrorScopeKey] = useState(null);
  const [funnelError, setFunnelError] = useState(null);
  const [companyReportError, setCompanyReportError] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [departmentId, setDepartmentId] = useState(null);
  const [programId, setProgramId] = useState(null);
  const [batchId, setBatchId] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [batches, setBatches] = useState([]);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [filtersError, setFiltersError] = useState(null);

  const isCollegeScoped = collegeId != null;

  const buildParams = useCallback(() => {
    const p = {};
    if (dateRange && dateRange[0]) {
      const start = typeof dateRange[0].startOf === "function" ? dateRange[0].startOf("day") : dateRange[0];
      p.appliedAfter = start.toISOString();
    }
    if (dateRange && dateRange[1]) {
      const end = typeof dateRange[1].endOf === "function" ? dateRange[1].endOf("day") : dateRange[1];
      p.appliedBefore = end.toISOString();
    }
    if (jobId != null && jobId !== "" && Number.isFinite(Number(jobId))) p.jobId = jobId;
    if (departmentId != null && Number.isFinite(Number(departmentId))) p.departmentId = departmentId;
    if (programId != null && Number.isFinite(Number(programId))) p.programId = programId;
    if (batchId != null && Number.isFinite(Number(batchId))) p.batchId = batchId;
    return p;
  }, [dateRange, jobId, departmentId, programId, batchId]);

  const fetchData = useCallback(async () => {
    const seq = ++requestSeqRef.current;
    const params = buildParams();
    const requestScopeKey = JSON.stringify([
      isCollegeScoped ? "college" : "placement",
      isCollegeScoped ? Number(collegeId) : null,
      params,
    ]);
    const scopeChanged = loadedScopeKeyRef.current !== requestScopeKey;
    setActiveScopeKey(requestScopeKey);
    if (scopeChanged) {
      setMetrics(null);
      setFunnel([]);
      setCompanyReport([]);
    }
    setLoading(true);
    setError(null);
    setErrorScopeKey(null);
    setFunnelError(null);
    setCompanyReportError(null);
    try {
      if (isCollegeScoped) {
        const [mRes, fRes, cRes] = await Promise.all([
          fetchWithErrorHandling(getAdminHiringMetrics(collegeId, params)),
          fetchWithErrorHandling(getAdminHiringFunnel(collegeId, params)),
          fetchWithErrorHandling(getAdminCompanyReport(collegeId, params)),
        ]);
        if (requestSeqRef.current !== seq) return;
        if (mRes.success) setMetrics(mRes.data);
        else {
          setError(mRes.error || "Failed to load metrics");
          setErrorScopeKey(requestScopeKey);
        }
        if (fRes.success) setFunnel(Array.isArray(fRes.data) ? fRes.data : []);
        else {
          if (scopeChanged) setFunnel([]);
          setFunnelError(fRes.error || "Failed to load funnel data");
        }
        if (cRes.success) setCompanyReport(Array.isArray(cRes.data) ? cRes.data : []);
        else {
          if (scopeChanged) setCompanyReport([]);
          setCompanyReportError(cRes.error || "Failed to load company report");
        }
        if (mRes.success || fRes.success || cRes.success) setLoadedScopeKey(requestScopeKey);
      } else {
        const [mRes, fRes, cRes] = await Promise.all([
          fetchWithErrorHandling(getPlacementHiringMetrics(params)),
          fetchWithErrorHandling(getPlacementHiringFunnel(params)),
          fetchWithErrorHandling(getPlacementCompanyReport(params)),
        ]);
        if (requestSeqRef.current !== seq) return;
        if (mRes.success) setMetrics(mRes.data);
        else {
          setError(mRes.error || "Failed to load metrics");
          setErrorScopeKey(requestScopeKey);
        }
        if (fRes.success) setFunnel(Array.isArray(fRes.data) ? fRes.data : []);
        else {
          if (scopeChanged) setFunnel([]);
          setFunnelError(fRes.error || "Failed to load funnel data");
        }
        if (cRes.success) setCompanyReport(Array.isArray(cRes.data) ? cRes.data : []);
        else {
          if (scopeChanged) setCompanyReport([]);
          setCompanyReportError(cRes.error || "Failed to load company report");
        }
        if (mRes.success || fRes.success || cRes.success) setLoadedScopeKey(requestScopeKey);
      }
    } catch (e) {
      if (requestSeqRef.current !== seq) return;
      setError(e?.message || "Failed to load hiring data");
      setErrorScopeKey(requestScopeKey);
      if (scopeChanged) {
        setMetrics(null);
        setFunnel([]);
        setCompanyReport([]);
      }
    } finally {
      if (requestSeqRef.current !== seq) return;
      setLoading(false);
    }
  }, [isCollegeScoped, collegeId, buildParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!isCollegeScoped || !collegeId) return;
    let cancelled = false;
    setFiltersLoading(true);
    setFiltersError(null);
    Promise.all([
      fetchWithErrorHandling(getJobsByCollege(collegeId)),
      fetchWithErrorHandling(getDepartmentsByCollege(collegeId)),
      fetchWithErrorHandling(getProgramsByCollege(collegeId)),
      fetchWithErrorHandling(getBatchesByCollege(collegeId)),
    ]).then(([jR, dR, pR, bR]) => {
      if (cancelled) return;
      if (jR.success && Array.isArray(jR.data)) setJobs(jR.data);
      if (dR.success && Array.isArray(dR.data)) setDepartments(dR.data);
      if (pR.success && Array.isArray(pR.data)) setPrograms(pR.data);
      if (bR.success && Array.isArray(bR.data)) setBatches(bR.data);
      // A failed filter fetch used to be swallowed here. The dropdown then rendered empty,
      // which is indistinguishable from "this college has no jobs/departments" -- so an admin
      // could conclude the data was missing when the request had simply failed. Name which
      // filters failed rather than showing a generic error.
      const failedFilters = [
        !jR.success && "jobs",
        !dR.success && "departments",
        !pR.success && "programs",
        !bR.success && "batches",
      ].filter(Boolean);
      setFiltersError(
        failedFilters.length > 0
          ? `Could not load ${failedFilters.join(", ")} for filtering. Those dropdowns are empty because the request failed, not because there is no data.`
          : null
      );
    }).finally(() => {
      if (!cancelled) setFiltersLoading(false);
    });
    return () => { cancelled = true; };
  }, [isCollegeScoped, collegeId]);

  const hasCurrentScope = activeScopeKey != null && loadedScopeKey === activeScopeKey;
  const currentError = activeScopeKey != null && errorScopeKey === activeScopeKey ? error : null;
  const initialLoading = loading && !hasCurrentScope;
  const refreshing = loading && hasCurrentScope;
  const maxFunnelCount = Math.max(1, ...funnel.map((s) => Number(s.count) || 0));

  // Only the date-range chip is shown — job/dept/program/batch already display their selected
  // value directly in their own Select, so a duplicate chip for those added noise, not signal.
  const activeFilterChips = [];
  if (dateRange && (dateRange[0] || dateRange[1])) {
    const fmt = (d) => (d ? d.format("DD MMM YYYY") : "…");
    activeFilterChips.push({ key: "dateRange", label: `Applied: ${fmt(dateRange[0])} - ${fmt(dateRange[1])}`, clear: () => setDateRange(null) });
  }
  const anyFilterActive = dateRange || (jobId != null && jobId !== "") || departmentId != null || programId != null || batchId != null;
  const clearAllFilters = () => {
    setDateRange(null);
    setJobId(null);
    setDepartmentId(null);
    setProgramId(null);
    setBatchId(null);
  };

  // The report mixes per-company rollup rows in with per-job rows (isCompanyTotal marks the
  // rollup). Rollups are pulled out of the paginated dataSource and rendered via the Table's
  // `summary` prop instead, so they stay visible as a pinned footer regardless of which page
  // the user is on or how far the table is scrolled horizontally.
  const companyJobRows = companyReport.filter((r) => !r.isCompanyTotal);
  const companyTotalRows = companyReport.filter((r) => r.isCompanyTotal);

  const companyColumns = [
    {
      title: "Company",
      dataIndex: "companyName",
      key: "companyName",
      width: 160,
      ellipsis: true,
    },
    { title: "Job", dataIndex: "jobTitle", key: "jobTitle", ellipsis: true },
    { title: "Applied", dataIndex: "applied", key: "applied", width: 80, align: "right" },
    { title: "Shortlisted", dataIndex: "shortlisted", key: "shortlisted", width: 90, align: "right" },
    { title: "Assessment", dataIndex: "assessment", key: "assessment", width: 95, align: "right" },
    { title: "Interview", dataIndex: "interview", key: "interview", width: 90, align: "right" },
    { title: "Offered", dataIndex: "offered", key: "offered", width: 85, align: "right" },
    { title: "Hired", dataIndex: "hired", key: "hired", width: 75, align: "right" },
    { title: "Rejected", dataIndex: "rejected", key: "rejected", width: 85, align: "right" },
  ];

  // Season-end stakeholder reports were assembled by hand from dozens of per-job CSVs — this
  // exports exactly what's on screen (summary metrics, funnel, company breakdown) as one CSV.
  const escapeCsvCell = (v) => {
    const s = String(v ?? "");
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const handleExportReport = () => {
    if (!metrics) return;
    const lines = [];
    lines.push("Hiring Report Summary");
    lines.push(`Total Applications,${metrics.totalApplications ?? 0}`);
    lines.push(`Applied,${metrics.applied ?? 0}`);
    lines.push(`Shortlisted,${metrics.shortlisted ?? 0}`);
    lines.push(`Assessment,${metrics.assessment ?? 0}`);
    lines.push(`Interview,${metrics.interview ?? 0}`);
    lines.push(`Offered,${metrics.offered ?? 0}`);
    lines.push(`Hired,${metrics.hired ?? 0}`);
    lines.push(`Rejected,${metrics.rejected ?? 0}`);
    // Withdrawn/Waitlisted are already folded into totalApplications by the backend (every
    // distinct applicationStatus is summed there) but previously had no line of their own here,
    // so the summary's total silently exceeded the sum of the lines above it. Surfacing them
    // explicitly makes "do these numbers add up" checkable again.
    lines.push(`Withdrawn,${metrics.withdrawn ?? 0}`);
    lines.push(`Waitlisted,${metrics.waitlisted ?? 0}`);
    if (metrics.avgTimeToShortlistMs != null) {
      lines.push(`Avg. time to shortlist (hrs),${Math.round(metrics.avgTimeToShortlistMs / (1000 * 60 * 60))}`);
    }
    lines.push("");
    lines.push("Hiring Funnel");
    lines.push("Stage,Count");
    funnel.forEach((f) => lines.push(`${escapeCsvCell(f.stage)},${f.count ?? 0}`));
    lines.push("");
    lines.push("Company-wise Report (per-job rows only; see Company Totals section below for rollups)");
    lines.push("Company,Job,Applied,Shortlisted,Assessment,Interview,Offered,Hired,Rejected");
    // MEDIUM FIX (this audit round): companyReport interleaves per-company "total" rollup rows
    // with per-job rows (matching the backend's raw ordering). The on-screen table deliberately
    // splits these — job rows in the body, totals pinned as a footer — so a total is never
    // mistaken for another job row when summing by hand. The CSV used to just dump the raw
    // interleaved list; now it mirrors the screen: per-job rows here, totals in their own
    // clearly-labeled section below.
    companyJobRows.forEach((r) => {
      lines.push([r.companyName, r.jobTitle, r.applied, r.shortlisted, r.assessment, r.interview, r.offered, r.hired, r.rejected]
        .map(escapeCsvCell).join(","));
    });
    if (companyTotalRows.length > 0) {
      lines.push("");
      lines.push("Company Totals");
      lines.push("Company,Applied,Shortlisted,Assessment,Interview,Offered,Hired,Rejected");
      companyTotalRows.forEach((r) => {
        lines.push([r.companyName, r.applied, r.shortlisted, r.assessment, r.interview, r.offered, r.hired, r.rejected]
          .map(escapeCsvCell).join(","));
      });
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hiring-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: 0 }}>
      <PlacementsPageOverview
        title="Placement Analytics"
        description="Track the hiring funnel, conversion and company performance for the selected college. Filters apply consistently to the headline metrics, funnel and company report below."
      />
      <Space wrap size="middle" style={{ marginBottom: 20 }}>
        <RangePicker
          allowClear
          value={dateRange}
          onChange={(dates) => setDateRange(dates)}
          showTime={false}
          placeholder={["Applied from", "Applied to"]}
          aria-label="Filter by date range"
        />
        {isCollegeScoped && (
          <>
            <Select
              placeholder="Job"
              aria-label="Filter by job"
              allowClear
              loading={filtersLoading}
              style={{ minWidth: 180 }}
              value={jobId ?? ""}
              onChange={(v) => setJobId(v === "" ? null : v)}
              options={[
                { value: "", label: "All jobs" },
                ...jobs.map((j) => ({ value: j.id, label: `${(j.jobTitle || "Job").substring(0, 30)} - ${j.companyName || ""}` })),
              ]}
            />
            <Select
              placeholder="Department"
              aria-label="Filter by department"
              allowClear
              loading={filtersLoading}
              style={{ minWidth: 140 }}
              value={departmentId ?? ""}
              onChange={(v) => {
                setDepartmentId(v === "" ? null : v);
                setProgramId(null);
              }}
              options={[
                { value: "", label: "All" },
                ...departments.map((d) => ({ value: d.id ?? d.deptId, label: d.name ?? d.deptName ?? d.dept_name })),
              ]}
            />
            <Select
              placeholder="Program"
              aria-label="Filter by program"
              allowClear
              loading={filtersLoading}
              style={{ minWidth: 140 }}
              value={programId ?? ""}
              onChange={(v) => setProgramId(v === "" ? null : v)}
              options={[
                { value: "", label: "All" },
                ...programs.map((p) => ({ value: p.id, label: p.name ?? p.programName })),
              ]}
            />
            <Select
              placeholder="Batch"
              aria-label="Filter by batch"
              allowClear
              loading={filtersLoading}
              style={{ minWidth: 120 }}
              value={batchId ?? ""}
              onChange={(v) => setBatchId(v === "" ? null : v)}
              options={[
                { value: "", label: "All" },
                ...batches.map((b) => ({ value: b.id ?? b.batchId, label: b.name ?? b.batchName ?? b.batch_name })),
              ]}
            />
          </>
        )}
        <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
          Refresh
        </Button>
        <Button icon={<DownloadOutlined />} onClick={handleExportReport} disabled={!metrics || loading}>
          Export report
        </Button>
      </Space>

      {anyFilterActive && (
        <Space wrap size={[8, 8]} style={{ marginTop: -12, marginBottom: 20 }}>
          {activeFilterChips.map((f) => (
            <Tag key={f.key} closable onClose={f.clear} color="blue">{f.label}</Tag>
          ))}
          <Button type="link" size="small" onClick={clearAllFilters} style={{ padding: 0 }}>Clear all</Button>
        </Space>
      )}

      {filtersError && (
        <Alert type="warning" message={filtersError} showIcon closable onClose={() => setFiltersError(null)} style={{ marginBottom: 16 }} />
      )}
      {refreshing ? <RefreshStatus label="Refreshing hiring dashboard…" /> : null}
      {currentError && (
        <Alert
          type={hasCurrentScope ? "warning" : "error"}
          message={hasCurrentScope ? "Couldn't refresh hiring metrics" : currentError}
          description={hasCurrentScope ? "Showing the last hiring data loaded for these filters." : undefined}
          showIcon
          action={<Button size="small" onClick={fetchData}>Retry</Button>}
          style={{ marginBottom: 16 }}
        />
      )}

      {initialLoading ? (
        <DashboardSkeleton metrics={6} label="Loading hiring dashboard" />
      ) : currentError && !hasCurrentScope ? null
      : metrics === null && !currentError ? (
        // Currently unreachable: the backend always returns a fully-zeroed metrics object, never null.
        // Left in place as a defensive fallback in case that contract changes.
        <Empty description="No data for the selected filters" style={{ padding: 48 }} />
      ) : (
        <>
          {/* Metrics Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card size="small">
                <Statistic title="Total Applications" value={metrics?.totalApplications ?? 0} />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4} lg={3}>
              <Card size="small">
                <Statistic title="Applied" value={metrics?.applied ?? 0} />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4} lg={3}>
              <Card size="small">
                <Statistic title="Shortlisted" value={metrics?.shortlisted ?? 0} />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4} lg={3}>
              <Card size="small">
                <Statistic title="Interview" value={metrics?.interview ?? 0} />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4} lg={3}>
              <Card size="small">
                <Statistic title="Offered" value={metrics?.offered ?? 0} />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4} lg={3}>
              <Card size="small">
                <Statistic title="Hired" value={metrics?.hired ?? 0} />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4} lg={3}>
              <Card size="small">
                <Statistic title="Rejected" value={metrics?.rejected ?? 0} />
              </Card>
            </Col>
            {/* MEDIUM/HIGH FIX (this audit round): Withdrawn/Waitlisted counts were already folded
                into totalApplications by the backend but had no card of their own, so "Total
                Applications" silently exceeded the sum of the visible cards. Adding these two
                makes the total reconcile with what's on screen. */}
            <Col xs={12} sm={8} md={4} lg={3}>
              <Card size="small">
                <Statistic title="Withdrawn" value={metrics?.withdrawn ?? 0} />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4} lg={3}>
              <Card size="small">
                <Statistic title="Waitlisted" value={metrics?.waitlisted ?? 0} />
              </Card>
            </Col>
            {metrics?.avgTimeToShortlistMs != null && (
              <Col xs={24} sm={12}>
                <Card size="small">
                  <Statistic
                    title="Avg. time to shortlist"
                    value={Math.round(metrics.avgTimeToShortlistMs / (1000 * 60 * 60))}
                    suffix="hrs"
                  />
                </Card>
              </Col>
            )}
          </Row>

          {/* Funnel */}
          <Card title="Hiring Funnel" style={{ marginBottom: 24 }}>
            {funnelError && (
              <Alert type="error" message={funnelError} showIcon style={{ marginBottom: 16 }} />
            )}
            <div style={{ maxWidth: 500 }}>
              {funnel.length === 0 ? (
                <Text type="secondary">No funnel data</Text>
              ) : (
                funnel.map((item, i) => {
                  const count = Number(item.count) || 0;
                  const pct = maxFunnelCount > 0 ? (count / maxFunnelCount) * 100 : 0;
                  const prevCount = i > 0 ? Number(funnel[i - 1].count) || 0 : null;
                  const conversionPct = prevCount != null && prevCount > 0 ? Math.round((count / prevCount) * 100) : null;
                  return (
                    <div key={item.stage || i} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <Space size={8}>
                          <Text strong>{STAGE_LABELS[item.stage] ?? item.stage}</Text>
                          {conversionPct != null && (
                            <Tag color="blue">
                              {conversionPct}% of {STAGE_LABELS[funnel[i - 1]?.stage] ?? funnel[i - 1]?.stage}
                            </Tag>
                          )}
                        </Space>
                        <Text>{count}</Text>
                      </div>
                      <div
                        style={{
                          height: 24,
                          background: token.colorFillSecondary,
                          borderRadius: 4,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            background: token.colorPrimary,
                            transition: "width 0.3s",
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Company Report */}
          <Card title="Company-wise Hiring Report">
            {companyReportError && (
              <Alert type="error" message={companyReportError} showIcon style={{ marginBottom: 16 }} />
            )}
            <Table
              dataSource={companyJobRows}
              columns={companyColumns}
              rowKey={(r) => `${r.jobId ?? "total"}-${r.companyName ?? ""}`}
              pagination={companyJobRows.length > 10 ? { pageSize: 10 } : false}
              size="small"
              scroll={{ x: 800 }}
              summary={() =>
                companyTotalRows.length === 0 ? null : (
                  <Table.Summary fixed="bottom">
                    {companyTotalRows.map((r, i) => (
                      <Table.Summary.Row
                        key={`${r.companyName ?? i}-total`}
                        className="hiring-company-total-row"
                      >
                        <Table.Summary.Cell index={0}>
                          <span style={{ fontWeight: 700 }}>{r.companyName}</span>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1}>{r.jobTitle}</Table.Summary.Cell>
                        <Table.Summary.Cell index={2} align="right">{r.applied}</Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align="right">{r.shortlisted}</Table.Summary.Cell>
                        <Table.Summary.Cell index={4} align="right">{r.assessment}</Table.Summary.Cell>
                        <Table.Summary.Cell index={5} align="right">{r.interview}</Table.Summary.Cell>
                        <Table.Summary.Cell index={6} align="right">{r.offered}</Table.Summary.Cell>
                        <Table.Summary.Cell index={7} align="right">{r.hired}</Table.Summary.Cell>
                        <Table.Summary.Cell index={8} align="right">{r.rejected}</Table.Summary.Cell>
                      </Table.Summary.Row>
                    ))}
                  </Table.Summary>
                )
              }
              locale={{
                emptyText: (
                  <Empty
                    description={
                      anyFilterActive
                        ? "No companies match these filters — try widening the date range or clearing filters"
                        : "No hiring data yet"
                    }
                  >
                    {anyFilterActive && (
                      <Button size="small" onClick={clearAllFilters}>Clear filters</Button>
                    )}
                  </Empty>
                ),
              }}
            />
          </Card>
        </>
      )}
    </div>
  );
}
