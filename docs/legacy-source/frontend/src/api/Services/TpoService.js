import Api from "../ApiMethod";

// TPO (Training & Placement Officer) API. Backend: controller/tpo/* (docs/recruiter-tpo-flows/TPO V1 -
// Locked.docx). Every call here goes through /api/v1/tpo/**, which the TPO admin or the college
// admin (where no TPO account exists) may use.

// --- Drives -----------------------------------------------------------------------------------
export const listDrives = () => Api.get("/api/v1/tpo/drives");
export const getDrive = (jobId) => Api.get(`/api/v1/tpo/drives/${jobId}`);
export const createDrive = (form) => Api.post("/api/v1/tpo/drives", form);
export const updateDrive = (jobId, form) => Api.put(`/api/v1/tpo/drives/${jobId}`, form);
export const getDriveRounds = (jobId) => Api.get(`/api/v1/tpo/drives/${jobId}/rounds`);
export const publishDrive = (jobId, notifyByEmail = true) =>
  Api.post(`/api/v1/tpo/drives/${jobId}/publish`, null, { params: { notifyByEmail } });
export const sendBackDrive = (jobId, note) => Api.post(`/api/v1/tpo/drives/${jobId}/send-back`, { note });
// Change requests (recruiter phase 1, N14): nothing is sent back; a field is proposed or asked for and answered in place.
export const listChangeRequests = (jobId) => Api.get(`/api/v1/tpo/drives/${jobId}/change-requests`);
/** The drive's internal discussion: the placement team only (recruiter phase 1, N7). */
export const listDriveInternalNotes = (jobId) => Api.get(`/api/v1/tpo/drives/${jobId}/internal-notes`);
export const addDriveInternalNote = (jobId, value) => Api.post(`/api/v1/tpo/drives/${jobId}/internal-notes`, { value });
/** The placement cell posted the drive; the company's recruiter reviews it (recruiter phase 1, N5 c). */
export const inviteRecruiterToReview = (jobId, body) => Api.post(`/api/v1/tpo/drives/${jobId}/invite-recruiter`, body);
export const createChangeRequest = (jobId, body) => Api.post(`/api/v1/tpo/drives/${jobId}/change-requests`, body);
export const acceptChangeRequest = (id) => Api.post(`/api/v1/tpo/change-requests/${id}/accept`);
export const answerChangeRequest = (id, value) => Api.post(`/api/v1/tpo/change-requests/${id}/answer`, { value });
export const replyChangeRequest = (id, value) => Api.post(`/api/v1/tpo/change-requests/${id}/reply`, { value });
export const withdrawChangeRequest = (id) => Api.post(`/api/v1/tpo/change-requests/${id}/withdraw`);
export const approveDrive = (jobId) => Api.post(`/api/v1/tpo/drives/${jobId}/approve`);
export const rejectDrive = (jobId, reason) => Api.post(`/api/v1/tpo/drives/${jobId}/reject`, { reason });
export const cancelDrive = (jobId, reason) => Api.post(`/api/v1/tpo/drives/${jobId}/cancel`, { reason });
export const deleteDraftDrive = (jobId) => Api.delete(`/api/v1/tpo/drives/${jobId}`);
export const closeDrive = (jobId) => Api.post(`/api/v1/tpo/drives/${jobId}/close`);
export const extendDeadline = (jobId, newDeadline) =>
  Api.post(`/api/v1/tpo/drives/${jobId}/extend-deadline`, { newDeadline });

// --- Applicants ---------------------------------------------------------------------------------
export const getApplicants = (jobId) => Api.get(`/api/v1/tpo/drives/${jobId}/applicants`);
export const getNotApplied = (jobId) => Api.get(`/api/v1/tpo/drives/${jobId}/applicants/not-applied`);
export const remindNotApplied = (jobId) => Api.post(`/api/v1/tpo/drives/${jobId}/applicants/remind-not-applied`);
export const addStudentsToDrive = (jobId, body) => Api.post(`/api/v1/tpo/drives/${jobId}/applicants/add-students`, body);
export const applyOnBehalf = (jobId, learnerId) =>
  Api.post(`/api/v1/tpo/drives/${jobId}/applicants/apply-on-behalf/${learnerId}`);
export const bulkMoveApplicants = (jobId, applicationIds, newStatus) =>
  Api.post(`/api/v1/tpo/drives/${jobId}/applicants/bulk-move`, { applicationIds, newStatus });
export const bulkRejectApplicants = (jobId, applicationIds, internalReason) =>
  Api.post(`/api/v1/tpo/drives/${jobId}/applicants/bulk-reject`, { applicationIds, internalReason });
export const undoBulkAction = (jobId, undoGroupId) =>
  Api.post(`/api/v1/tpo/drives/${jobId}/applicants/undo/${undoGroupId}`);

// --- Rounds and results --------------------------------------------------------------------------
export const stageResult = (roundId, body) => Api.post(`/api/v1/tpo/rounds/${roundId}/results`, body);
export const pendingResults = (roundId) => Api.get(`/api/v1/tpo/rounds/${roundId}/results/pending`);
export const applyRoundResults = (roundId, notify = true) =>
  Api.post(`/api/v1/tpo/rounds/${roundId}/results/apply`, null, { params: { notify } });

// --- Offers ----------------------------------------------------------------------------------
export const recordSelection = (body) => Api.post("/api/v1/tpo/offers/record-selection", body);
export const attachOfferLetter = (offerId, letterUrl) => Api.post(`/api/v1/tpo/offers/${offerId}/letter`, { letterUrl });
export const verifyAndReleaseOffer = (offerId) => Api.post(`/api/v1/tpo/offers/${offerId}/verify-and-release`);
/** Verify and release many selections in one call. Answers { released: [ids], failed: [{ offerId, reason }] }. */
export const bulkVerifyOffers = (offerIds) => Api.post("/api/v1/tpo/offers/bulk-verify", { offerIds });
export const externalAcceptance = (offerId) => Api.post(`/api/v1/tpo/offers/${offerId}/external-acceptance`);
export const withdrawOffer = (offerId, reason) => Api.post(`/api/v1/tpo/offers/${offerId}/withdraw`, { reason });
export const setJoiningStatus = (offerId, status) => Api.post(`/api/v1/tpo/offers/${offerId}/joining-status`, { status });
export const reverseAcceptance = (offerId, reason) => Api.post(`/api/v1/tpo/offers/${offerId}/reverse-acceptance`, { reason });

// --- RecruiterLeads -----------------------------------------------------------------------------------
export const getRecruiterLeadsBoard = () => Api.get("/api/v1/tpo/recruiter-leads");
export const checkRecruiterLead = (emailOrPhone) => Api.get("/api/v1/tpo/recruiter-leads/check", { params: { emailOrPhone } });
export const addRecruiterLead = (body) => Api.post("/api/v1/tpo/recruiter-leads", body);
export const logRecruiterLeadActivity = (recruiterLeadId, body) => Api.post(`/api/v1/tpo/recruiter-leads/${recruiterLeadId}/activity`, body);
export const updateRecruiterLead = (recruiterLeadId, body) => Api.put(`/api/v1/tpo/recruiter-leads/${recruiterLeadId}`, body);
export const addFollowUp = (recruiterLeadId, body) => Api.post(`/api/v1/tpo/recruiter-leads/${recruiterLeadId}/follow-ups`, body);
export const markFollowUpDone = (followUpId) => Api.post(`/api/v1/tpo/recruiter-leads/follow-ups/${followUpId}/done`);
export const moveFollowUp = (followUpId, dueAt) => Api.put(`/api/v1/tpo/recruiter-leads/follow-ups/${followUpId}/move`, { dueAt });
export const dueFollowUps = () => Api.get("/api/v1/tpo/recruiter-leads/follow-ups/due");
export const markRecruiterLeadNotNow = (recruiterLeadId, body) => Api.post(`/api/v1/tpo/recruiter-leads/${recruiterLeadId}/not-now`, body);
export const inviteRecruiterLead = (recruiterLeadId, body = {}) => Api.post(`/api/v1/tpo/recruiter-leads/${recruiterLeadId}/invite`, body);

// --- Students --------------------------------------------------------------------------------
export const listStudents = () => Api.get("/api/v1/tpo/students");
export const upsertAcademicRecord = (learnerId, body) => Api.put(`/api/v1/tpo/students/${learnerId}/academic-record`, body);
export const debarStudent = (learnerId, body) => Api.post(`/api/v1/tpo/students/${learnerId}/debar`, body);
export const liftDebarment = (debarmentId, reason) => Api.post(`/api/v1/tpo/students/debarments/${debarmentId}/lift`, { reason });
export const getDebarments = (learnerId) => Api.get(`/api/v1/tpo/students/${learnerId}/debarments`);

// --- Requests --------------------------------------------------------------------------------
export const getPendingRequests = () => Api.get("/api/v1/tpo/requests/pending");
export const decideRequest = (requestId, approve, reason) =>
  Api.post(`/api/v1/tpo/requests/${requestId}/decide`, { approve, reason });

// --- Season and settings -----------------------------------------------------------------------
export const getCurrentSeason = () => Api.get("/api/v1/tpo/season/current");
export const listSeasons = () => Api.get("/api/v1/tpo/season");
export const startSeason = (body) => Api.post("/api/v1/tpo/season", body);
export const openRegistration = (seasonId, deadline) =>
  Api.post(`/api/v1/tpo/season/${seasonId}/open-registration`, null, { params: { deadline } });

export const getPlacementRules = () => Api.get("/api/v1/tpo/settings/placement-rules");
export const savePlacementRules = (body) => Api.put("/api/v1/tpo/settings/placement-rules", body);
export const getWhatCompaniesSee = () => Api.get("/api/v1/tpo/settings/what-companies-see");
export const saveWhatCompaniesSee = (body) => Api.put("/api/v1/tpo/settings/what-companies-see", body);

// --- recruiter access to my college -----------------------------------------------------------------
export const listRecruiterAccess = () => Api.get("/api/v1/tpo/recruiter-access");
export const extendRecruiterAccess = (recruiterId, months) => Api.post(`/api/v1/tpo/recruiter-access/${recruiterId}/extend`, { months });
export const revokeRecruiterAccess = (recruiterId, reason) => Api.post(`/api/v1/tpo/recruiter-access/${recruiterId}/revoke`, { reason });

// --- The public side of an invite link (no login) ---------------------------------------------
export const previewRecruiterInvite = (token) => Api.get(`/api/v1/public/recruiter-invite/${encodeURIComponent(token)}`);
export const recruiterInviteNotHiring = (token) => Api.post(`/api/v1/public/recruiter-invite/${encodeURIComponent(token)}/not-hiring`);
export const recruiterInviteUnsubscribe = (token) => Api.post(`/api/v1/public/recruiter-invite/${encodeURIComponent(token)}/unsubscribe`);
export const acceptRecruiterInvite = (token, body) => Api.post(`/api/v1/public/recruiter-invite/${encodeURIComponent(token)}/accept`, body);
/** Emails the code that proves the work address; accepting needs it (recruiter phase 1). */
export const sendRecruiterInviteCode = (token, email) => Api.post(`/api/v1/public/recruiter-invite/${encodeURIComponent(token)}/send-code`, { email });

// A college's company link (recruiter phase 1, N5 b): public, no session.
export const previewCompanyJoin = (token) => Api.get(`/api/v1/public/company-join/${encodeURIComponent(token)}`);
export const sendCompanyJoinCode = (token, email) => Api.post(`/api/v1/public/company-join/${encodeURIComponent(token)}/send-code`, { email });
export const joinCompanyLink = (token, body) => Api.post(`/api/v1/public/company-join/${encodeURIComponent(token)}/join`, body);

// A college's public link for recruiters (phase 2, N5 a): public, no session.
export const previewCollegeJoin = (token) => Api.get(`/api/v1/public/college-join/${encodeURIComponent(token)}`);
export const sendCollegeJoinCode = (token, email) => Api.post(`/api/v1/public/college-join/${encodeURIComponent(token)}/send-code`, { email });
export const joinCollegeLink = (token, body) => Api.post(`/api/v1/public/college-join/${encodeURIComponent(token)}/join`, body);

// The college's public placements page (D2): public, on the college's own address.
export const getPublicPlacementsPage = () => Api.get("/api/v1/public/placements-page");
export const sendRecruitCode = (email) => Api.post("/api/v1/public/placements-page/send-code", { email });
export const recruitFromCollege = (body) => Api.post("/api/v1/public/placements-page/recruit", body);

// A campaign email's unsubscribe link (public).
export const unsubscribeCampaign = (token) => Api.post(`/api/v1/public/campaign-unsubscribe/${encodeURIComponent(token)}`);
