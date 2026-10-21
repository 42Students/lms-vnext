import Api from "../ApiMethod";

/**
 * Interview Service
 * Organization-scoped interview scheduling. Backend derives createdBy from auth context.
 *
 * SECURITY NOTE: learnerId / organizationId in URL paths must be validated server-side
 * against the JWT-authenticated user. These client-side params are for routing only.
 */

function requireId(value, name) {
  if (value == null || value === "" || (typeof value === "number" && !Number.isFinite(value))) {
    throw new Error(`${name} is required and must be a valid value`);
  }
}

// Schedule a new interview (admin/placement)
export const scheduleInterview = (interview) => {
  if (!interview || !interview.job?.id || !interview.jobApplication?.id || !interview.learner?.id) {
    return Promise.reject(new Error("Interview data must include job, jobApplication, and learner IDs"));
  }
  return Api.post("/api/v1/interviews", interview);
};

// Get all interviews for organization (org derived from auth context on backend)
// For super admin: pass collegeId so backend can filter when auth has no college/org.
// First arg can be: config object { collegeId, signal }, or numeric collegeId (for Superadmin when college selected).
export const getInterviewsForOrganization = (organizationIdOrConfig, config) => {
  const axiosConfig = config ?? (typeof organizationIdOrConfig === "object" ? organizationIdOrConfig : undefined);
  const collegeId =
    typeof organizationIdOrConfig === "object"
      ? organizationIdOrConfig?.collegeId
      : typeof organizationIdOrConfig === "number" && Number.isFinite(organizationIdOrConfig)
        ? organizationIdOrConfig
        : null;
  const params = collegeId != null && Number.isFinite(collegeId) ? { collegeId } : {};
  const merged = { ...axiosConfig, params: { ...params, ...(axiosConfig?.params || {}) } };
  return Api.get("/api/v1/interviews", merged);
};

// Get interviews for a job application
// Second arg can be organizationId (ignored, backward compat) or config object.
export const getInterviewsForApplication = (applicationId, organizationIdOrConfig, config) => {
  requireId(applicationId, "applicationId");
  const axiosConfig = config ?? (typeof organizationIdOrConfig === "object" ? organizationIdOrConfig : undefined);
  return Api.get(`/api/v1/interviews/application/${applicationId}`, axiosConfig);
};

// Get interviews for a learner (supports optional page/size for pagination)
// organizationId can be null — backend resolves from JWT/DB for learners
export const getInterviewsForLearner = async (learnerId, organizationId, config, page, size) => {
  requireId(learnerId, "learnerId");
  const orgParam = organizationId != null && organizationId !== "" ? organizationId : "null";
  const params = {};
  if (page != null) params.page = page;
  if (size != null) params.size = size;
  const merged = Object.keys(params).length
    ? { ...config, params: { ...(config?.params || {}), ...params } }
    : config;
  const url = `/api/v1/interviews/learner/${learnerId}/organization/${orgParam}`;
  const response = await Api.get(url, merged);

  // Both student Interviews (Past) and Career Calendar load page by page. They
  // previously broke out of their loops on an unsuccessful page and accepted the
  // preceding pages as the *complete* history. Reject non-success and malformed
  // successful pages here so both callers reach their existing error/retry UI.
  if (response?.data?.status !== "success") {
    throw new Error("Unable to load the complete interview history. Please retry.");
  }
  const payload = response.data.data;
  if (!Array.isArray(payload) && !Array.isArray(payload?.content)) {
    throw new Error("Interview history returned an invalid page. Please retry.");
  }
  return response;
};

// Get upcoming interviews for a learner
// organizationId can be null — backend resolves from JWT/DB for learners
export const getUpcomingInterviewsForLearner = (learnerId, organizationId, config) => {
  requireId(learnerId, "learnerId");
  const orgParam = organizationId != null && organizationId !== "" ? organizationId : "null";
  const url = `/api/v1/interviews/learner/${learnerId}/upcoming/organization/${orgParam}`;
  return Api.get(url, config);
};

// Get interview by ID
export const getInterviewById = (interviewId, organizationId) => {
  requireId(interviewId, "interviewId");
  requireId(organizationId, "organizationId");
  return Api.get(`/api/v1/interviews/${interviewId}/organization/${organizationId}`);
};

// Update interview (admin/placement)
export const updateInterview = (interviewId, interview, organizationId) => {
  requireId(interviewId, "interviewId");
  requireId(organizationId, "organizationId");
  return Api.put(`/api/v1/interviews/${interviewId}/organization/${organizationId}`, interview);
};

// Cancel interview (admin/placement)
export const cancelInterview = (interviewId, organizationId) => {
  requireId(interviewId, "interviewId");
  requireId(organizationId, "organizationId");
  return Api.post(`/api/v1/interviews/${interviewId}/cancel/organization/${organizationId}`);
};

// Confirm interview (Learner)
// organizationId can be null — backend resolves from interview record
export const confirmInterview = (interviewId, learnerId, organizationId) => {
  requireId(interviewId, "interviewId");
  requireId(learnerId, "learnerId");
  const orgParam = organizationId != null && organizationId !== "" ? organizationId : null;
  const url = orgParam != null
    ? `/api/v1/interviews/${interviewId}/confirm/learner/${learnerId}/organization/${orgParam}`
    : `/api/v1/interviews/${interviewId}/confirm/learner/${learnerId}`;
  return Api.post(url);
};

// Request reschedule (Learner)
// organizationId can be null — backend resolves from interview record
// details (optional): { reason, note, windows } — Student V1: actually reaches the placement cell now.
export const requestReschedule = (interviewId, learnerId, organizationId, details) => {
  requireId(interviewId, "interviewId");
  requireId(learnerId, "learnerId");
  const orgParam = organizationId != null && organizationId !== "" ? organizationId : null;
  const url = orgParam != null
    ? `/api/v1/interviews/${interviewId}/request-reschedule/learner/${learnerId}/organization/${orgParam}`
    : `/api/v1/interviews/${interviewId}/request-reschedule/learner/${learnerId}`;
  return Api.post(url, details || undefined);
};

// Decline an interview outright (Learner) — distinct from requesting a reschedule.
// organizationId can be null — backend resolves from interview record; still required in the
// path since that's the only route mounted server-side.
export const declineInterview = (interviewId, learnerId, organizationId) => {
  requireId(interviewId, "interviewId");
  requireId(learnerId, "learnerId");
  const orgParam = organizationId != null && organizationId !== "" ? organizationId : 0;
  return Api.post(`/api/v1/interviews/${interviewId}/decline/learner/${learnerId}/organization/${orgParam}`);
};

// Mark interview as completed (Admin, after round has taken place)
export const markInterviewCompleted = (interviewId, organizationId) => {
  requireId(interviewId, "interviewId");
  requireId(organizationId, "organizationId");
  return Api.post(`/api/v1/interviews/${interviewId}/complete/organization/${organizationId}`);
};

// Cancel a reschedule request (Learner — reverts RESCHEDULE_REQUESTED → SCHEDULED)
// organizationId can be null — backend resolves from interview record
export const cancelRescheduleRequest = (interviewId, learnerId, organizationId) => {
  requireId(interviewId, "interviewId");
  requireId(learnerId, "learnerId");
  const orgParam = organizationId != null && organizationId !== "" ? organizationId : null;
  const url = orgParam != null
    ? `/api/v1/interviews/${interviewId}/cancel-reschedule-request/learner/${learnerId}/organization/${orgParam}`
    : `/api/v1/interviews/${interviewId}/cancel-reschedule-request/learner/${learnerId}`;
  return Api.post(url);
};

// Submit interview feedback (Admin, after round completion)
// Body: { rating: 1-5, comments: string, recommendAction: "PROCEED_NEXT_ROUND"|"HIRE"|"REJECT"|"HOLD" }
export const submitInterviewFeedback = (interviewId, body) => {
  requireId(interviewId, "interviewId");
  return Api.post(`/api/v1/interviews/${interviewId}/feedback`, body || {});
};

// P4 in the college-admin audit: interviewers are free text, and the server's double-booking check
// matches on that text — so a retype ("R. Sharma" for "Rahul Sharma") silently disables the check
// for that person. This backs a suggest control offering the spellings already in use.
export const getInterviewerNames = (axiosConfig) =>
  Api.get("/api/v1/interviews/interviewers", axiosConfig);
