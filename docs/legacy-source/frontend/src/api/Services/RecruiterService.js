import Api from "../ApiMethod";

// recruiter (industry recruiter) self-service API. Backend: RecruiterSelfController (/api/v1/recruiter).

/** Who the recruiter is, the current scope (GLOBAL or COLLEGE) and the colleges they may enter. */
export const getRecruiterMe = () => Api.get("/api/v1/recruiter/me");

/** Placements UX pass: cross-college Home dashboard (totals, per-college breakdown, recent unified threads). */
export const getRecruiterHome = () => Api.get("/api/v1/recruiter/home");
/** The unified inbox: every message thread across every college this recruiter can reach, newest first. */
export const getHrAllThreads = () => Api.get("/api/v1/recruiter/messages/threads");
/** Placements UX pass: proactive notifications - a feed across every college, plus an unread count. */
export const getRecruiterNotifications = () => Api.get("/api/v1/recruiter/notifications");
/** Just the bell badge number (polled), so the whole feed is fetched only when the panel opens. */
export const getRecruiterNotificationsUnread = () => Api.get("/api/v1/recruiter/notifications/unread-count");
export const markRecruiterNotificationsRead = () => Api.put("/api/v1/recruiter/notifications/mark-all-read");

/** Update own name, email or designation. Mobile and company are managed by the super admin. */
export const updateRecruiterMe = (data) => Api.put("/api/v1/recruiter/me", data);

/** recruiter V1 §4 Colleges list: every college this recruiter can reach, with logo, graduating count, branches, drives-with-you and TPO contact. */
export const getRecruiterColleges = () => Api.get("/api/v1/recruiter/colleges");

// --- Plan a drive across several colleges in one action (backend: RecruiterPlanDriveController) -----------------------
export const planDrive = (form, collegeIds) => Api.post("/api/v1/recruiter/plan-drive", { form, collegeIds });
export const getMyDriveGroups = () => Api.get("/api/v1/recruiter/drive-groups");
export const getDriveGroupDetail = (groupId) => Api.get(`/api/v1/recruiter/drive-groups/${groupId}`);
export const addCollegeToGroup = (groupId, collegeId) => Api.post(`/api/v1/recruiter/drive-groups/${groupId}/add-college`, { collegeId });

// --- A college the recruiter has access to (backend: RecruiterCollegeController) -------------------------------
/** Counts and bands only, rounded, small groups hidden. Never names. */
export const getCollegeOverview = (collegeId) => Api.get(`/api/v1/recruiter/colleges/${collegeId}/overview`);
export const listDriveRequests = (collegeId) => Api.get(`/api/v1/recruiter/colleges/${collegeId}/drive-requests`);
export const createDriveRequest = (collegeId, form) => Api.post(`/api/v1/recruiter/colleges/${collegeId}/drive-requests`, form);
export const resubmitDriveRequest = (collegeId, jobId, form) => Api.put(`/api/v1/recruiter/colleges/${collegeId}/drive-requests/${jobId}`, form);

// --- Invitations that need the recruiter's own yes (backend: RecruiterPendingInviteController) ------------------------
export const getPendingInvites = () => Api.get("/api/v1/recruiter/pending-invites");
export const acceptPendingInvite = (collegeId) => Api.post(`/api/v1/recruiter/pending-invites/${collegeId}/accept`);
export const declinePendingInvite = (collegeId) => Api.post(`/api/v1/recruiter/pending-invites/${collegeId}/decline`);

// --- Working a drive the recruiter owns (backend: RecruiterDriveController) ----------------------------------------
const C = (collegeId) => `/api/v1/recruiter/colleges/${collegeId}`;
export const listMyDrives = (collegeId) => Api.get(`${C(collegeId)}/drives`);
// Change requests on a drive (recruiter phase 1, N14): the college's Institutional requests and the company's own.
export const listRecruiterChangeRequests = (collegeId, jobId) => Api.get(`${C(collegeId)}/drives/${jobId}/change-requests`);
export const createRecruiterChangeRequest = (collegeId, jobId, body) => Api.post(`${C(collegeId)}/drives/${jobId}/change-requests`, body);
export const acceptRecruiterChangeRequest = (collegeId, id) => Api.post(`${C(collegeId)}/change-requests/${id}/accept`);
export const answerRecruiterChangeRequest = (collegeId, id, value) => Api.post(`${C(collegeId)}/change-requests/${id}/answer`, { value });
export const replyRecruiterChangeRequest = (collegeId, id, value) => Api.post(`${C(collegeId)}/change-requests/${id}/reply`, { value });
export const withdrawRecruiterChangeRequest = (collegeId, id) => Api.post(`${C(collegeId)}/change-requests/${id}/withdraw`);
export const listDriveRounds = (collegeId, jobId) => Api.get(`${C(collegeId)}/drives/${jobId}/rounds`);
export const addDriveRound = (collegeId, jobId, body) => Api.post(`${C(collegeId)}/drives/${jobId}/rounds`, body);
export const updateDriveRound = (collegeId, jobId, roundId, body) => Api.put(`${C(collegeId)}/drives/${jobId}/rounds/${roundId}`, body);
export const deleteDriveRound = (collegeId, jobId, roundId) => Api.delete(`${C(collegeId)}/drives/${jobId}/rounds/${roundId}`);
export const getDriveApplicants = (collegeId, jobId) => Api.get(`${C(collegeId)}/drives/${jobId}/applicants`);
/** Placements UX pass: the drive pipeline funnel, same shape as the TPO's own drive dashboard. */
export const getDrivePipeline = (collegeId, jobId) => Api.get(`${C(collegeId)}/drives/${jobId}/pipeline`);
export const submitRoundResults = (collegeId, jobId, roundId, rows) => Api.post(`${C(collegeId)}/drives/${jobId}/rounds/${roundId}/results`, { rows });
export const listRoundSlots = (collegeId, jobId, roundId) => Api.get(`${C(collegeId)}/drives/${jobId}/rounds/${roundId}/slots`);
export const proposeRoundSlots = (collegeId, jobId, roundId, slots) => Api.post(`${C(collegeId)}/drives/${jobId}/rounds/${roundId}/slots`, { slots });
export const submitSelectionList = (collegeId, jobId, body) => Api.post(`${C(collegeId)}/drives/${jobId}/selections`, body);
export const listHrThreads = (collegeId) => Api.get(`${C(collegeId)}/messages/threads`);
export const getHrThread = (collegeId, threadId) => Api.get(`${C(collegeId)}/messages/threads/${threadId}`);
/** { version }: changes with any new message or read in this recruiter's conversations with the college (useLivePulse). */
export const getRecruiterMessagesPulse = (collegeId) => Api.get(`${C(collegeId)}/messages/pulse`);
export const sendRecruiterMessage = (collegeId, jobId, body, changeRequestId = null) => Api.post(`${C(collegeId)}/messages`, { jobId, body, changeRequestId });
/** The recruiter's own private ratings and notes on a drive's applicants (never visible to the placement cell). */
export const listDriveNotes = (collegeId, jobId) => Api.get(`${C(collegeId)}/drives/${jobId}/notes`);
export const saveDriveNote = (collegeId, jobId, applicantId, rating, note) => Api.put(`${C(collegeId)}/drives/${jobId}/notes/${encodeURIComponent(applicantId)}`, { rating, note });
export const downloadDriveResumesZip = (collegeId, jobId) => Api.post(`${C(collegeId)}/drives/${jobId}/resumes`, null, { responseType: "blob" });

// --- recruiter V2 workspace (backend: RecruiterDriveController, RecruiterSelfController) -------------------------------------------
/** What needs the recruiter now at this college, what is coming this week, and the busiest live drive. */
export const getRecruiterToday = (collegeId) => Api.get(`${C(collegeId)}/today`);
/** Rounds, slots, deadlines and result due dates in [from, to) (ISO date-times). */
export const getRecruiterCalendar = (collegeId, from, to) => Api.get(`${C(collegeId)}/calendar`, { params: { from, to } });
export const listDriveOffers = (collegeId, jobId) => Api.get(`${C(collegeId)}/drives/${jobId}/offers`);
/** The company as students see it (read-only: managed centrally). */
export const getRecruiterCompany = (collegeId) => Api.get(`${C(collegeId)}/company`);
/** Colleagues of the same company who can work with this college. */
export const getRecruiterTeam = (collegeId) => Api.get(`${C(collegeId)}/team`);
/** Funnel and offer outcomes for the recruiter's drives at this college. */
export const getRecruiterReports = (collegeId) => Api.get(`${C(collegeId)}/reports`);
