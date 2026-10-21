import Api from "../ApiMethod";

/**
 * Placement Job Service
 * Organization-scoped job management from /superadmin (LMS mode).
 * Backend: /api/v1/admin/placement/jobs — organizationId from auth context.
 */

export const getJobsForOrganization = () =>
  Api.get("/api/v1/admin/placement/jobs");

export const getJobById = (jobId) =>
  Api.get(`/api/v1/admin/placement/jobs/${jobId}`);

export const createJob = (job) =>
  Api.post("/api/v1/admin/placement/jobs", job);

export const updateJob = (jobId, job) =>
  Api.put(`/api/v1/admin/placement/jobs/${jobId}`, job);

export const setJobStatus = (jobId, isActive) =>
  Api.post(`/api/v1/admin/placement/jobs/${jobId}/status`, { isActive });

export const getApplicationsForJob = (jobId) =>
  Api.get(`/api/v1/admin/placement/jobs/${jobId}/applications`);

export const updateApplicationStatus = (applicationId, newStatus, rejectionReason = null) => {
  const body = { newStatus };
  if (rejectionReason != null && String(rejectionReason).trim()) body.rejectionReason = String(rejectionReason).trim();
  return Api.post(`/api/v1/admin/placement/jobs/applications/${applicationId}/status`, body);
};

export const getAllApplicationsForOrganization = () =>
  Api.get("/api/v1/admin/placement/jobs/applications");

/**
 * Hiring metrics (Phase 5 - 15.1, 15.3). Org-scoped. Optional filters.
 * @param {Object} params - { jobId, appliedAfter, appliedBefore, departmentId, programId, batchId, classId }
 */
export const getPlacementHiringMetrics = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") sp.set(k, String(v));
  });
  const qs = sp.toString();
  return Api.get(`/api/v1/admin/placement/jobs/applications/metrics${qs ? `?${qs}` : ""}`);
};

/**
 * Hiring funnel (Phase 5 - 15.2, 15.3). Org-scoped.
 */
export const getPlacementHiringFunnel = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") sp.set(k, String(v));
  });
  const qs = sp.toString();
  return Api.get(`/api/v1/admin/placement/jobs/applications/funnel${qs ? `?${qs}` : ""}`);
};

/**
 * Company-wise hiring report (Phase 5 - 15.4). Org-scoped.
 */
export const getPlacementCompanyReport = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") sp.set(k, String(v));
  });
  const qs = sp.toString();
  return Api.get(`/api/v1/admin/placement/jobs/applications/company-report${qs ? `?${qs}` : ""}`);
};
