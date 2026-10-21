import { useState, useEffect, useCallback } from "react";
import { parsePlacementUtcDateTime } from "@/utils/placementDateTime";
import { Fact, Facts } from "@/components/Common/Facts";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import { Alert, Skeleton, Card, Row, Col, Statistic, Button, Tag, Space, Typography, Divider } from "antd";
import { EditOutlined, TeamOutlined, WarningOutlined, RightOutlined } from "@ant-design/icons";
import AdminLayout from "@/layouts/AdminLayout";
import JobsErrorBoundary from "@/components/ErrorBoundary/JobsErrorBoundary";
import DriveSubNav from "@/components/admin/placements/DriveSubNav";
import PlacementsCompanyAvatar from "@/components/Placements/PlacementsCompanyAvatar";
import ModuleGroupGuard from "@/components/admin/ModuleGroupGuard";
import { getAdminJobById, getAdminHiringMetrics, getAdminNeedsAttentionSummary } from "@/api/Services/AdminService";

const { Text, Title, Paragraph } = Typography;

const ATTENTION_CATEGORIES = [
  { key: "staleApplications", label: "No action in a week", tab: "APPLIED" },
  { key: "unscheduledInterviews", label: "Marked Interview, nothing scheduled", tab: "INTERVIEW" },
  { key: "missingOfferLetters", label: "Offered, no offer letter attached", tab: "OFFERED" },
];

/**
 * A drive's Overview — what an admin sees first on drilling in from the Drives landing page:
 * who it's with, where the pipeline stands, and quick jumps into the sections that matter.
 */
export default function AdminDriveOverviewPage() {
  const router = useRouter();
  const { jobId } = router.query;
  const loginUser = useSelector((state) => state.loginUser);
  const collegeId = loginUser?.collegeId ?? null;

  const [job, setJob] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attentionLoading, setAttentionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metricsError, setMetricsError] = useState(null);
  const [thisDriveAttention, setThisDriveAttention] = useState([]);

  // job and metrics are fetched independently — the page's header/company info/buttons only
  // depend on `job`, so a metrics failure shouldn't hide them. Only a `job` fetch failure is
  // fatal to the whole page; a `metrics` failure just degrades the Pipeline card.
  const fetchData = useCallback(async () => {
    if (!jobId || !collegeId) return;
    setLoading(true);
    setError(null);
    setMetricsError(null);
    try {
      const parsedJobId = parseInt(jobId, 10);
      const [jobResult, metricsResult] = await Promise.allSettled([
        getAdminJobById(parsedJobId, collegeId),
        getAdminHiringMetrics(collegeId, { jobId: parsedJobId }),
      ]);

      if (jobResult.status === "fulfilled") {
        setJob(jobResult.value?.data?.data ?? jobResult.value?.data ?? null);
      } else {
        setError(jobResult.reason?.response?.data?.message || "Could not load this drive.");
      }

      if (metricsResult.status === "fulfilled") {
        setMetrics(metricsResult.value?.data?.data ?? metricsResult.value?.data ?? null);
      } else {
        setMetricsError(metricsResult.reason?.response?.data?.message || "Could not load pipeline metrics.");
      }
    } finally {
      setLoading(false);
    }
  }, [jobId, collegeId]);

  // The landing page's needs-attention queue is college-wide; drilling into one drive shouldn't
  // mean losing that context and having to go back and re-scan it for this job specifically.
  const fetchAttention = useCallback(async () => {
    if (!jobId || !collegeId) return;
    setAttentionLoading(true);
    try {
      const parsedJobId = parseInt(jobId, 10);
      const res = await getAdminNeedsAttentionSummary(collegeId);
      if (res?.data?.status !== "success") return;
      const summary = res.data.data || {};
      const rows = [];
      ATTENTION_CATEGORIES.forEach((cat) => {
        (summary[cat.key]?.items || [])
          .filter((item) => item.jobId === parsedJobId)
          .forEach((item) => rows.push({ ...item, categoryLabel: cat.label, tab: cat.tab }));
      });
      const closingSoon = (summary.closingSoonLowConversion?.items || []).some((item) => item.jobId === parsedJobId);
      if (closingSoon) rows.push({ categoryLabel: "Closing soon", detail: "Low conversion so far", tab: null });
      setThisDriveAttention(rows);
    } catch {
      // Non-critical — the landing page's queue is still the source of truth if this fails.
    } finally {
      setAttentionLoading(false);
    }
  }, [jobId, collegeId]);

  useEffect(() => {
    fetchData();
    fetchAttention();
  }, [fetchData, fetchAttention]);

  if (collegeId == null) {
    return (
      <div className="ln-module admin-list-page placements-page">
        <Alert type="warning" message="Admin not assigned to a college" showIcon />
      </div>
    );
  }

  return (
    <JobsErrorBoundary onBack={() => router.push("/college-admin/jobs")}>
      <div className="ln-module admin-list-page placements-page">
        {/* See jobs/[jobId]/applications.js for why this needs its own ModuleGroupGuard. */}
        <ModuleGroupGuard groupKey="placements">
        <DriveSubNav jobId={jobId} jobTitle={job?.jobTitle} companyName={job?.companyName} active="overview" basePath="/college-admin" />

        {loading || attentionLoading ? (
          <>
            <Skeleton active paragraph={{ rows: 1, width: "80%" }} title={false} style={{ marginBottom: 16 }} />
            <Card style={{ marginBottom: 16 }}>
              <Space align="start" style={{ width: "100%", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <Skeleton avatar active paragraph={{ rows: 2, width: ["60%", "40%"] }} title={false} style={{ maxWidth: 320 }} />
                <Space>
                  <Skeleton.Button active style={{ width: 110 }} />
                  <Skeleton.Button active style={{ width: 140 }} />
                </Space>
              </Space>
            </Card>
            <Card title="Pipeline">
              <Row gutter={16}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Col xs={12} sm={8} md={4} key={i}>
                    <Skeleton active paragraph={{ rows: 1, width: "50%" }} title={{ width: "70%" }} />
                  </Col>
                ))}
              </Row>
            </Card>
          </>
        ) : error ? (
          <Alert type="error" message={error} showIcon />
        ) : !job ? null : (
          <>
            {thisDriveAttention.length > 0 && (() => {
              const grouped = new Map();
              thisDriveAttention.forEach((row) => {
                if (!grouped.has(row.categoryLabel)) grouped.set(row.categoryLabel, []);
                grouped.get(row.categoryLabel).push(row);
              });
              return (
                <Alert
                  type="warning"
                  showIcon
                  icon={<WarningOutlined />}
                  style={{ marginBottom: 16 }}
                  message={`Needs attention (${thisDriveAttention.length})`}
                  description={
                    <div>
                      {[...grouped.entries()].map(([label, rows]) => (
                        <div key={label} style={{ marginBottom: 8 }}>
                          <Text strong style={{ fontSize: 12 }}>{label} <Tag style={{ marginLeft: 4 }}>{rows.length}</Tag></Text>
                          {rows.map((row, idx) => row.applicationId ? (
                            <Button
                              key={idx}
                              type="link"
                              size="small"
                              style={{ display: "block", height: "auto", padding: "2px 0 2px 4px", textAlign: "left", fontSize: 13 }}
                              onClick={() => router.push(`/college-admin/jobs/${jobId}/applications${row.tab ? `?status=${row.tab}` : ""}`)}
                            >
                              {row.learnerName ? `${row.learnerName} — ` : ""}{row.detail || ""}
                              <RightOutlined style={{ fontSize: 10, marginLeft: 6 }} />
                            </Button>
                          ) : (
                            <div key={idx} style={{ padding: "2px 0 2px 4px" }}>
                              {row.learnerName ? `${row.learnerName} — ` : ""}{row.detail || ""}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  }
                />
              );
            })()}
            <Card
              style={{
                marginBottom: 16,
                borderLeft: `3px solid ${job.isDraft ? "#8c8c8c" : job.isActive ? "#52c41a" : "#8c8c8c"}`,
              }}
            >
              <Space align="start" style={{ width: "100%", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <Space align="start">
                  <PlacementsCompanyAvatar companyName={job.companyName} companyLogo={job.companyLogo} size={56} />
                  <div>
                    <Title level={4} style={{ margin: 0 }}>{job.jobTitle}</Title>
                    <Text type="secondary">{job.companyName}</Text>
                    {/* "Active" next to "Draft" next to "FULL_TIME" read as three unrelated words: each now says what it is. */}
                    <Facts size="small" className="lms-job-header__facts">
                      <Fact label="Status">
                        {/* The same words as the drives list: Draft, Open, Open · Expired (deadline passed), Closed. */}
                        {job.isDraft ? <Tag>Draft</Tag>
                          : !job.isActive ? <Tag>Closed</Tag>
                            : job.applicationDeadline && parsePlacementUtcDateTime(job.applicationDeadline)?.isBefore(new Date()) ? <Tag color="orange">Open · Expired</Tag>
                              : <Tag color="green">Open</Tag>}
                      </Fact>
                      {job.jobType && <Fact label="Job type"><Tag>{(String(job.jobType).includes("_") ? String(job.jobType).replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase()) : String(job.jobType))}</Tag></Fact>}
                    </Facts>
                  </div>
                </Space>
                <Space>
                  <Button icon={<EditOutlined />} onClick={() => router.push(`/college-admin/jobs/${jobId}/settings`)}>
                    Edit drive
                  </Button>
                  <Button type="primary" icon={<TeamOutlined />} onClick={() => router.push(`/college-admin/jobs/${jobId}/applications`)}>
                    View applications
                  </Button>
                </Space>
              </Space>
              {job.jobDescription && (
                <>
                  <Divider style={{ margin: "16px 0 12px" }} />
                  <Paragraph type="secondary" style={{ margin: 0 }} ellipsis={{ rows: 3, expandable: true, symbol: "Show more" }}>
                    {job.jobDescription}
                  </Paragraph>
                </>
              )}
            </Card>

            <Card title="Pipeline">
              {metricsError ? (
                <Alert
                  type="warning"
                  showIcon
                  message="Could not load pipeline metrics"
                  description={metricsError}
                />
              ) : (
                <Row gutter={16}>
                  {/* This is a current-status snapshot (a GROUP BY on each application's current
                      status), not a cumulative funnel — an earlier stage reading 0 while a later
                      stage has activity is normal (everyone who passed through has since moved
                      on) and is NOT a sign anything was skipped. Render plainly; no stuck/skipped
                      detection without a backend change to return cumulative funnel counts. */}
                  {[
                    { key: "applied", label: "Applied", accent: "#0a7c88" },
                    { key: "shortlisted", label: "Shortlisted" },
                    { key: "assessment", label: "Assessment" },
                    { key: "interview", label: "Interview" },
                    { key: "offered", label: "Offered" },
                    { key: "hired", label: "Hired", accent: "#3f8600" },
                  ].map((stage) => (
                    <Col xs={12} sm={8} md={4} key={stage.key}>
                      <Statistic
                        title={stage.label}
                        value={Number(metrics?.[stage.key] ?? 0)}
                        valueStyle={stage.accent ? { color: stage.accent } : undefined}
                      />
                    </Col>
                  ))}
                </Row>
              )}
            </Card>
          </>
        )}
        </ModuleGroupGuard>
      </div>
    </JobsErrorBoundary>
  );
}

AdminDriveOverviewPage.adminLayout = AdminLayout;
