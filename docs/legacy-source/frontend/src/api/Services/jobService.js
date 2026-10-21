import Api from "../ApiMethod";
import { requireVerifiedApplicationLookup } from "@/utils/placementsAppliedLookup";
import { createReconciledApply } from "@/utils/placementsApplyReconciliation";

/**
 * Job Service
 * Phase 3: Jobs Core - Learner-facing job system APIs
 *
 * SECURITY NOTE: learnerId in URL paths must be validated server-side
 * against the JWT-authenticated user. These client-side params are for routing only.
 */

function requireId(value, name) {
  if (value == null || value === "" || (typeof value === "number" && !Number.isFinite(value))) {
    throw new Error(`${name} is required and must be a valid value`);
  }
}

/**
 * Get all active jobs for a learner's organization.
 * Backend expects /active/{learnerId}; organization is derived from learner.
 * @param {number|string} learnerId - Required. Learner ID (validated server-side).
 * @returns {Promise}
 */
export const getAllActiveJobs = (learnerId) => {
  requireId(learnerId, "learnerId");
  return Api.get(`/api/v1/jobs/active/${learnerId}`);
};

// Get all jobs with eligibility status for a learner
export const getAllJobsWithEligibility = (learnerId, config) => {
  requireId(learnerId, "learnerId");
  return Api.get(`/api/v1/jobs/all/${learnerId}`, config);
};

// Get job by ID
export const getJobById = (jobId) => {
  requireId(jobId, "jobId");
  return Api.get(`/api/v1/jobs/${jobId}`);
};

// Get job with visibility status for a learner (preferred)
export const getJobWithVisibility = (jobId, learnerId) => {
  requireId(jobId, "jobId");
  requireId(learnerId, "learnerId");
  return Api.get(`/api/v1/jobs/${jobId}/visibility/${learnerId}`);
};

// Resolve uncertain writes against /applied; never encourage a duplicate POST
// merely because the server response was lost. The resume stays in the body.
const reconciledApply = createReconciledApply({
  submit: (jobId, learnerId, resumeUrl) => {
    const url = `/api/v1/jobs/${jobId}/apply/${learnerId}`;
    const body = resumeUrl && String(resumeUrl).trim() ? { resumeUrl: String(resumeUrl).trim() } : {};
    return Api.post(url, Object.keys(body).length > 0 ? body : undefined);
  },
  check: (jobId, learnerId) => checkIfApplied(jobId, learnerId),
});

export const applyToJob = (jobId, learnerId, resumeUrl = null) => {
  requireId(jobId, "jobId");
  requireId(learnerId, "learnerId");
  return reconciledApply(jobId, learnerId, resumeUrl);
};

// Get all applications for a learner
export const getLearnerApplications = (learnerId, config) => {
  requireId(learnerId, "learnerId");
  return Api.get(`/api/v1/jobs/applications/${learnerId}`, config);
};

// Get application by ID
export const getApplicationById = (applicationId) => {
  requireId(applicationId, "applicationId");
  return Api.get(`/api/v1/jobs/applications/details/${applicationId}`);
};

/**
 * Get application status history (timeline). Gap 8.2.
 * @param {number|string} applicationId - Required.
 * @returns {Promise}
 */
export const getApplicationHistory = (applicationId) => {
  requireId(applicationId, "applicationId");
  return Api.get(`/api/v1/jobs/applications/${applicationId}/history`);
};

// Check if learner has already applied to this job. Malformed successful
// responses are unknown, never proof that it is safe to submit another write.
export const checkIfApplied = (jobId, learnerId) => {
  requireId(jobId, "jobId");
  requireId(learnerId, "learnerId");
  return Api.get(`/api/v1/jobs/${jobId}/applied/${learnerId}`)
    .then(requireVerifiedApplicationLookup);
};

// Withdraw one explicit application. Application identity is used rather than (jobId, learnerId)
// so the UI always mutates the exact journey/card the learner selected.
export const withdrawApplication = (applicationId, learnerId) => {
  requireId(applicationId, "applicationId");
  requireId(learnerId, "learnerId");
  return Api.post(`/api/v1/jobs/applications/${applicationId}/withdraw/${learnerId}`);
};

// Accept/decline an OFFERED application
export const respondToOffer = (applicationId, learnerId, accept) => {
  requireId(applicationId, "applicationId");
  requireId(learnerId, "learnerId");
  return Api.post(`/api/v1/jobs/applications/${applicationId}/offer-response/${learnerId}`, { accept: Boolean(accept) });
};

// Student V1 "Offers get their own table": what accepting would do to every other active
// application — withdrawn / stays open (college rules) / other pending offer declined.
// Read-only, safe to call before the student commits to accepting.
export const previewOfferAccept = (applicationId, learnerId) => {
  requireId(applicationId, "applicationId");
  requireId(learnerId, "learnerId");
  return Api.get(`/api/v1/jobs/applications/${applicationId}/offer-accept-preview/${learnerId}`);
};

// 8.5 / 21.2.6: Saved jobs
export const saveJob = (jobId, learnerId) => {
  requireId(jobId, "jobId");
  requireId(learnerId, "learnerId");
  return Api.post(`/api/v1/jobs/${jobId}/save/${learnerId}`);
};

export const unsaveJob = (jobId, learnerId) => {
  requireId(jobId, "jobId");
  requireId(learnerId, "learnerId");
  return Api.delete(`/api/v1/jobs/${jobId}/unsave/${learnerId}`);
};

export const getSavedJobs = (learnerId) => {
  requireId(learnerId, "learnerId");
  return Api.get(`/api/v1/jobs/saved/${learnerId}`);
};

export const getSavedJobIds = (learnerId) => {
  requireId(learnerId, "learnerId");
  return Api.get(`/api/v1/jobs/saved-ids/${learnerId}`);
};

/**
 * Get job important-date events for admin Interview Calendar.
 * start/end: ISO date-time strings for the view range.
 */
export const getJobCalendarDatesForAdmin = (start, end, config) => {
  const params = new URLSearchParams({ start, end });
  return Api.get(`/api/v1/jobs/calendar-dates?${params.toString()}`, config);
};

/**
 * Get job important-date events for learner Career Calendar.
 * start/end: ISO date-time strings for the view range.
 */
export const getJobCalendarDatesForLearner = (learnerId, start, end, config) => {
  requireId(learnerId, "learnerId");
  const params = new URLSearchParams({ start, end });
  return Api.get(`/api/v1/jobs/calendar-dates/learner/${learnerId}?${params.toString()}`, config);
};
