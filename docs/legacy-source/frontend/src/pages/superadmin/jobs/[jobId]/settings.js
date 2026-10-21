import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import { Alert, Spin, Card, Button, Popconfirm, message, Typography } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import JobsErrorBoundary from "@/components/ErrorBoundary/JobsErrorBoundary";
import DriveSubNav from "@/components/admin/placements/DriveSubNav";
import JobForm from "../../sections/JobForm";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";
import { getAdminJobById, getAdminHiringMetrics, setAdminJobStatus, deleteAdminJob } from "@/api/Services/AdminService";

const { Text } = Typography;

export default function SuperAdminDriveSettingsPage() {
  const router = useRouter();
  const { jobId } = router.query;
  const { selectedCollegeId: collegeId } = useSuperAdminScope();

  const [job, setJob] = useState(null);
  const [applicantCount, setApplicantCount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [mutationError, setMutationError] = useState(null);
  const mutationRef = useRef(null);
  const jobFormRef = useRef(null);

  // BE-0193: the drive and its applicant count load separately. A failed count only leaves the count unknown, and a failed
  // drive load says so (with Retry) instead of spinning for ever.
  const [loadError, setLoadError] = useState(null);
  const fetchJob = useCallback(async () => {
    if (!jobId || !collegeId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const parsedJobId = parseInt(jobId, 10);
      const [jobRes, metricsRes] = await Promise.allSettled([
        getAdminJobById(parsedJobId, collegeId),
        getAdminHiringMetrics(collegeId, { jobId: parsedJobId }),
      ]);
      if (jobRes.status === "fulfilled") {
        const loaded = jobRes.value?.data?.data ?? jobRes.value?.data ?? null;
        setJob(loaded);
        if (!loaded) setLoadError("This drive could not be found.");
      } else {
        setLoadError(jobRes.reason?.response?.data?.message || "This drive could not be loaded.");
      }
      const metrics = metricsRes.status === "fulfilled" ? (metricsRes.value?.data?.data ?? metricsRes.value?.data ?? null) : null;
      setApplicantCount(metrics?.totalApplications ?? null);
    } finally {
      setLoading(false);
    }
  }, [jobId, collegeId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleToggleStatus = async () => {
    if (mutationRef.current || statusLoading || !job) return false;
    mutationRef.current = "status";
    setStatusLoading(true);
    setMutationError(null);
    try {
      const opening = !job.isActive;
      const res = await setAdminJobStatus(parseInt(jobId, 10), opening, collegeId);
      if (res?.data?.status !== "success") throw new Error(res?.data?.message || "Failed to update drive status");
      message.success(`Drive ${opening ? "opened" : "closed"}`);
      fetchJob();
      return true;
    } catch (e) {
      const errorMessage = e?.response?.data?.message || e?.message || "Failed to update drive status";
      setMutationError({ kind: "status", message: errorMessage });
      message.error(errorMessage);
      throw e;
    } finally {
      mutationRef.current = null;
      setStatusLoading(false);
    }
  };

  const handleDelete = async () => {
    if (mutationRef.current || deleteLoading) return false;
    mutationRef.current = "delete";
    setDeleteLoading(true);
    setMutationError(null);
    try {
      const res = await deleteAdminJob(parseInt(jobId, 10), collegeId);
      if (res?.data?.status !== "success") throw new Error(res?.data?.message || "Failed to delete drive");
      message.success("Drive deleted");
      router.push("/superadmin/jobs");
      return true;
    } catch (e) {
      const errorMessage = e?.response?.data?.message || e?.message || "Failed to delete drive";
      setMutationError({ kind: "delete", message: errorMessage });
      message.error(errorMessage);
      throw e;
    } finally {
      mutationRef.current = null;
      setDeleteLoading(false);
    }
  };

  if (collegeId == null) {
    return (
      <div className="ln-module admin-list-page placements-page">
        <Alert type="warning" message="Select a college to continue" showIcon />
      </div>
    );
  }

  return (
    <JobsErrorBoundary onBack={() => router.push("/superadmin/jobs")}>
      <div className="ln-module admin-list-page placements-page">
        <DriveSubNav
          jobId={jobId}
          jobTitle={job?.jobTitle}
          companyName={job?.companyName}
          active="settings"
          onBeforeNavigate={() => jobFormRef.current?.isDirty?.() ?? false}
          basePath="/superadmin"
        />
        {!job && loadError && !loading ? (
          <Alert type="error" showIcon message={loadError} action={<Button size="small" onClick={fetchJob}>Retry</Button>} data-testid="drive-settings-load-error" />
        ) : loading || !job ? (
          <div style={{ textAlign: "center", padding: 40 }}><Spin /></div>
        ) : (
          <>
            {mutationError ? (
              <Alert type="error" showIcon closable
                message={mutationError.kind === "status" ? "Drive status was not changed" : "Drive was not deleted"}
                description={mutationError.message}
                onClose={() => setMutationError(null)}
                style={{ marginBottom: 12 }}
              />
            ) : null}
            <JobForm
              ref={jobFormRef}
              job={job}
              collegeId={collegeId}
              onSuccess={() => router.push(`/superadmin/jobs/${jobId}`)}
              onCancel={() => router.push(`/superadmin/jobs/${jobId}`)}
            />

            {!job.isDraft && (
              <Card title="Drive status" style={{ marginTop: 16 }} size="small">
                <Popconfirm
                  title={`Are you sure you want to ${job.isActive ? "close" : "open"} this drive?`}
                  onConfirm={handleToggleStatus}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button type={job.isActive ? "default" : "primary"} danger={job.isActive} loading={statusLoading}
                    disabled={deleteLoading}>
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
                <Button type="primary" danger icon={<DeleteOutlined />} loading={deleteLoading}
                  disabled={statusLoading}>
                  Delete drive
                </Button>
              </Popconfirm>
            </Card>
          </>
        )}
      </div>
    </JobsErrorBoundary>
  );
}

SuperAdminDriveSettingsPage.superAdminLayout = SuperAdminLayout;
