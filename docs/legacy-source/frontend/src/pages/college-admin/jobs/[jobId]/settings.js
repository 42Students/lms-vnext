import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import { Alert, Card, Button, Popconfirm, message, Typography } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import AdminLayout from "@/layouts/AdminLayout";
import JobsErrorBoundary from "@/components/ErrorBoundary/JobsErrorBoundary";
import DriveSubNav from "@/components/admin/placements/DriveSubNav";
import JobForm from "../../../superadmin/sections/JobForm";
import ModuleGroupGuard from "@/components/admin/ModuleGroupGuard";
import { PanelError } from "@/components/Common/PanelStates";
import { DetailSkeleton, RefreshStatus } from "@/components/Common/Skeletons";
import { getAdminJobById, getAdminHiringMetrics, setAdminJobStatus, deleteAdminJob } from "@/api/Services/AdminService";

const { Text } = Typography;

export default function AdminDriveSettingsPage() {
  const router = useRouter();
  const { jobId } = router.query;
  const loginUser = useSelector((state) => state.loginUser);
  const collegeId = loginUser?.collegeId ?? null;

  const [job, setJob] = useState(null);
  const [applicantCount, setApplicantCount] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [metricsError, setMetricsError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const jobFormRef = useRef(null);
  const loadedJobIdRef = useRef(null);
  const mutationRef = useRef(false);

  const fetchJob = useCallback(async () => {
    if (!jobId || !collegeId) return;
    const parsedJobId = parseInt(jobId, 10);
    const sameScope = loadedJobIdRef.current === parsedJobId;
    setLoading(true);
    setLoadError(null);
    setMetricsError(null);
    if (!sameScope) {
      setJob(null);
      setApplicantCount(null);
    }
    const [jobResult, metricsResult] = await Promise.allSettled([
      getAdminJobById(parsedJobId, collegeId),
      getAdminHiringMetrics(collegeId, { jobId: parsedJobId }),
    ]);
    if (jobResult.status === "fulfilled") {
      const nextJob = jobResult.value?.data?.data ?? jobResult.value?.data ?? null;
      if (nextJob && typeof nextJob === "object") {
        setJob(nextJob);
        loadedJobIdRef.current = parsedJobId;
      } else {
        if (!sameScope) setJob(null);
        setLoadError("Drive details could not be loaded.");
      }
    } else {
      // A failed refresh of the same drive keeps the details already on screen.
      if (!sameScope) setJob(null);
      setLoadError(jobResult.reason?.response?.data?.message || "Drive details could not be loaded.");
    }
    if (metricsResult.status === "fulfilled") {
      const metrics = metricsResult.value?.data?.data ?? metricsResult.value?.data ?? null;
      const count = Number(metrics?.totalApplications);
      if (Number.isFinite(count) && count >= 0) setApplicantCount(count);
      else {
        setApplicantCount(null);
        setMetricsError("Applicant impact could not be verified.");
      }
    } else {
      setApplicantCount(null);
      setMetricsError(metricsResult.reason?.response?.data?.message || "Applicant impact could not be verified.");
    }
    setLoading(false);
  }, [jobId, collegeId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleToggleStatus = async () => {
    if (mutationRef.current || !job) return;
    mutationRef.current = true;
    setStatusLoading(true);
    try {
      const res = await setAdminJobStatus(parseInt(jobId, 10), !job.isActive, collegeId);
      if (res?.data?.status === "success") {
        message.success(`Drive ${!job.isActive ? "opened" : "closed"}`);
        fetchJob();
      } else {
        message.error(res?.data?.message || "Failed to update drive status");
      }
    } catch (e) {
      message.error(e?.response?.data?.message || "Failed to update drive status");
    } finally {
      mutationRef.current = false;
      setStatusLoading(false);
    }
  };

  const handleDelete = async () => {
    if (mutationRef.current || metricsError || applicantCount == null) return;
    mutationRef.current = true;
    setDeleteLoading(true);
    try {
      const res = await deleteAdminJob(parseInt(jobId, 10), collegeId);
      if (res?.data?.status === "success") {
        message.success("Drive deleted");
        router.push("/college-admin/jobs");
      } else {
        message.error(res?.data?.message || "Failed to delete drive");
      }
    } catch (e) {
      message.error(e?.response?.data?.message || "Failed to delete drive");
    } finally {
      mutationRef.current = false;
      setDeleteLoading(false);
    }
  };

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
        <DriveSubNav
          jobId={jobId}
          jobTitle={job?.jobTitle}
          companyName={job?.companyName}
          active="settings"
          onBeforeNavigate={() => jobFormRef.current?.isDirty?.() ?? false}
          basePath="/college-admin"
        />
        {loading && !job ? (
          <DetailSkeleton label="Loading drive settings" withMedia={false} />
        ) : loadError && !job ? (
          <PanelError title={loadError} onRetry={fetchJob} />
        ) : job ? (
          <>
            {loading && <RefreshStatus label="Refreshing drive settings…" />}
            {loadError && (
              <Alert type="warning" showIcon message="Couldn't refresh drive settings"
                description={loadError}
                action={<Button size="small" onClick={fetchJob}>Retry</Button>}
                style={{ marginBottom: 12 }} />
            )}
            <JobForm
              ref={jobFormRef}
              job={job}
              collegeId={collegeId}
              onSuccess={() => router.push(`/college-admin/jobs/${jobId}`)}
              onCancel={() => router.push(`/college-admin/jobs/${jobId}`)}
            />

            {metricsError ? (
              <Alert type="warning" showIcon message="Drive impact is unavailable" description={metricsError}
                action={<Button size="small" onClick={fetchJob}>Retry impact</Button>} style={{ marginTop: 16 }} />
            ) : null}

            {!job.isDraft && (
              <Card title="Drive status" style={{ marginTop: 16 }} size="small">
                <Popconfirm
                  title={`Are you sure you want to ${job.isActive ? "close" : "open"} this drive?`}
                  onConfirm={handleToggleStatus}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button type={job.isActive ? "default" : "primary"} danger={job.isActive} loading={statusLoading} disabled={mutationRef.current}>
                    {job.isActive ? "Close drive" : "Open drive"}
                  </Button>
                </Popconfirm>
              </Card>
            )}

            {/* Distinct red register, not just another same-weight settings card — Close/Open is
                fully reversible, Delete isn't, and the two used to look like identical utility
                boxes with only body copy telling them apart. */}
            <Card
              title={<span style={{ color: "#cf1322" }}>Danger zone</span>}
              style={{ marginTop: 24, borderColor: "#ffccc7" }}
              headStyle={{ borderColor: "#ffccc7", background: "#fff1f0" }}
              size="small"
            >
              {applicantCount > 0 && (
                <Text type="danger" style={{ display: "block", marginBottom: 12 }}>
                  {applicantCount} learner(s) have applied to this drive. Deleting it will not notify them, and their applications remain.
                </Text>
              )}
              <Popconfirm
                title={`Delete "${job.jobTitle || "this drive"}"?`}
                description={
                  applicantCount > 0
                    ? `${applicantCount} learner(s) have applied to this drive. Deleting it removes the listing but their applications remain — they will not be notified. This action cannot be undone.`
                    : "This will permanently remove the drive. This action cannot be undone."
                }
                onConfirm={handleDelete}
                okText="Delete"
                okType="danger"
                cancelText="Cancel"
              >
                <Button type="primary" danger icon={<DeleteOutlined />} loading={deleteLoading} disabled={mutationRef.current || Boolean(metricsError) || applicantCount == null}>
                  Delete drive
                </Button>
              </Popconfirm>
            </Card>
          </>
        ) : null}
        </ModuleGroupGuard>
      </div>
    </JobsErrorBoundary>
  );
}

AdminDriveSettingsPage.adminLayout = AdminLayout;
