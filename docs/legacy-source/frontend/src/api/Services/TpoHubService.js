import Api from "../ApiMethod";

// TPO V1 - everything beyond the base drive/recruiter lead/offer calls in TpoService.js: the Drive page workspace,
// Students hub, Home, Calendar, Reports, RecruiterLeads hub, scheduling, drive day, Messages, Share, Team and Settings.
// Backend: controller/tpo/TpoWorkspaceController, TpoStudentsHubController, TpoHubController.
const W = "/api/v1/tpo";

// --- Drive workspace (Drive page tabs) -----------------------------------------------------------
export const getWorkspaceApplicants = (jobId) => Api.get(`${W}/drives/${jobId}/workspace/applicants`);
export const getWorkspaceOffers = (jobId) => Api.get(`${W}/drives/${jobId}/workspace/offers`);
export const getWorkspaceRounds = (jobId) => Api.get(`${W}/drives/${jobId}/workspace/rounds`);
export const getWorkspaceSummary = (jobId) => Api.get(`${W}/drives/${jobId}/workspace/summary`);
export const getDriveActivity = (jobId) => Api.get(`${W}/drives/${jobId}/workspace/activity`);
export const getDriveCounts = () => Api.get(`${W}/drives/counts`);
export const getEligibilityPreview = (jobId) => Api.get(`${W}/drives/${jobId}/eligibility-preview`);
export const createRound = (jobId, form) => Api.post(`${W}/drives/${jobId}/rounds`, form);
export const updateRound = (jobId, roundId, form) => Api.put(`${W}/drives/${jobId}/rounds/${roundId}`, form);
export const deleteRound = (jobId, roundId) => Api.delete(`${W}/drives/${jobId}/rounds/${roundId}`);
export const previewResultsImport = (roundId, rows) => Api.post(`${W}/rounds/${roundId}/results/import-preview`, { rows });
export const commitResultsImport = (roundId, rows, notInFileAction) =>
  Api.post(`${W}/rounds/${roundId}/results/import`, { rows, notInFileAction });
export const previewSelectionsImport = (jobId, rows) => Api.post(`${W}/drives/${jobId}/offers/import-preview`, { rows });
export const commitSelectionsImport = (jobId, rows) => Api.post(`${W}/drives/${jobId}/offers/import`, { rows });
export const offerToNextWaitlisted = (offerId) => Api.post(`${W}/offers/${offerId}/offer-next`);
/** Placements UX pass, "Waitlist Promotion Preview": who offer-next would pick and why anyone
 * ahead of them would be skipped - read only, before committing to freeing the seat. */
export const previewOfferToNext = (offerId) => Api.get(`${W}/offers/${offerId}/offer-next-preview`);
export const setAutoApply = (jobId, enabled) => Api.post(`${W}/drives/${jobId}/auto-apply`, { enabled });
export const setEligibilityOverride = (jobId, body) => Api.post(`${W}/drives/${jobId}/overrides`, body);
export const removeEligibilityOverride = (jobId, learnerId) => Api.delete(`${W}/drives/${jobId}/overrides/${learnerId}`);
export const cloneDrive = (jobId) => Api.post(`${W}/drives/${jobId}/clone`);
export const approveAndPublishDrive = (jobId) => Api.post(`${W}/drives/${jobId}/approve-and-publish`);
export const getAuditLog = (params) => Api.get(`${W}/audit`, { params });
export const getBell = (limit) => Api.get(`${W}/bell`, limit ? { params: { limit } } : undefined);
export const bellReadAll = () => Api.post(`${W}/bell/read-all`);
export const bellRead = (id) => Api.post(`${W}/bell/${id}/read`);
// The sidebar and the top bar both read these on every page load; asking within a few seconds of each other shares
// one request instead of two.
let countsRequest = null;
let countsRequestedAt = 0;
export const getCounts = () => {
  const now = Date.now();
  if (countsRequest && now - countsRequestedAt < 5000) return countsRequest;
  countsRequestedAt = now;
  countsRequest = Api.get(`${W}/counts`);
  countsRequest.catch(() => { countsRequest = null; });
  return countsRequest;
};

// --- Students hub ---------------------------------------------------------------------------------
/** Students in placements (the Students page). getStudentsTable({ everyone: true }) lists every student, for pickers. */
export const getStudentsTable = (params) => Api.get(`${W}/students/table`, params ? { params } : undefined);
export const getStudentDetail = (learnerId) => Api.get(`${W}/students/${learnerId}/detail`);
export const getPrepCourses = () => Api.get(`${W}/students/prep-courses`);
export const getRequestsQueue = (includeDecided = false, decidedDays) => Api.get(`${W}/students/requests-queue`, { params: { includeDecided, ...(decidedDays != null ? { decidedDays } : {}) } });
export const addStudentNote = (learnerId, note) => Api.post(`${W}/students/${learnerId}/notes`, { note });
/** choice: PLACEMENTS | HIGHER_STUDIES | ENTREPRENEURSHIP | COMPETITIVE_EXAMS | NOT_INTERESTED; label: one of the college's outcome labels; detail: the exam, the business. */
export const registerStudent = (learnerId, choice, label = null, detail = null) => Api.post(`${W}/students/${learnerId}/register`, { choice, label, detail });
export const bulkNudge = (learnerIds, message) => Api.post(`${W}/students/bulk/nudge`, { learnerIds, message });
export const bulkAssignPrep = (body) => Api.post(`${W}/students/bulk/assign-prep`, body);
export const bulkHigherStudies = (learnerIds) => Api.post(`${W}/students/bulk/higher-studies`, { learnerIds });
export const bulkDebar = (body) => Api.post(`${W}/students/bulk/debar`, body);
// The Students page's Actions window (docs/tpo-ux/STUDENTS-ACTIONS-PLAN-2026-10-05.md).
export const bulkRegister = (learnerIds, choice, label, detail = null) => Api.post(`${W}/students/bulk/register`, { learnerIds, choice, label, detail });
export const bulkLiftDebarment = (learnerIds, reason) => Api.post(`${W}/students/bulk/lift-debarment`, { learnerIds, reason });
export const bulkNote = (learnerIds, note) => Api.post(`${W}/students/bulk/note`, { learnerIds, note });
export const bulkDriveOverride = (body) => Api.post(`${W}/students/bulk/drive-override`, body);
export const restoreDriveOverride = (jobId, rows) => Api.post(`${W}/students/bulk/drive-override/restore`, { jobId, rows });
export const bulkVerifyStudents = (learnerIds) => Api.post(`${W}/students/bulk/verify`, { learnerIds });
export const bulkSendBack = (learnerIds, section, reason) => Api.post(`${W}/students/bulk/send-back`, { learnerIds, section, reason });
export const previewAcademicImport = (rows) => Api.post(`${W}/students/academic-import/preview`, { rows });
export const commitAcademicImport = (rows) => Api.post(`${W}/students/academic-import`, { rows });

// --- Home, calendar, reports ----------------------------------------------------------------------
export const getHome = (params) => Api.get(`${W}/home`, { params });
export const getCalendar = (from, to) => Api.get(`${W}/calendar`, { params: { from, to } });
export const blockedCheck = (date) => Api.get(`${W}/calendar/blocked-check`, { params: { date } });
export const getReportList = () => Api.get(`${W}/reports`);
export const getReport = (name, params) => Api.get(`${W}/reports/${name}`, { params });
export const globalSearch = (q) => Api.get(`${W}/search`, { params: { q } });
export const getMyAccess = () => Api.get(`${W}/my-access`);
export const getDriveDayMine = () => Api.get(`${W}/drive-day/mine`);
export const getStats = (params) => Api.get(`${W}/stats`, { params });

// --- RecruiterLeads hub ------------------------------------------------------------------------------------
export const getRecruiterLeadTable = () => Api.get(`${W}/recruiter-leads-hub/table`);
export const getRecruiterLeadPage = (recruiterLeadId) => Api.get(`${W}/recruiter-leads-hub/${recruiterLeadId}`);
export const bulkRecruiterLeadOwner = (recruiterLeadIds, ownerFacultyId) => Api.post(`${W}/recruiter-leads-hub/bulk/owner`, { recruiterLeadIds, ownerFacultyId });
export const bulkRecruiterLeadStage = (body) => Api.post(`${W}/recruiter-leads-hub/bulk/stage`, body);
export const previewRecruiterLeadImport = (rows) => Api.post(`${W}/recruiter-leads-hub/import/preview`, { rows });
export const commitRecruiterLeadImport = (rows, ownerFacultyId) => Api.post(`${W}/recruiter-leads-hub/import`, { rows, ownerFacultyId });
export const getMailStatus = () => Api.get(`${W}/mail-status`);
export const bulkInviteRecruiterLeads = (recruiterLeadIds, note) => Api.post(`${W}/recruiter-leads-hub/bulk/invite`, { recruiterLeadIds, note });
export const getCompanies = () => Api.get(`${W}/companies`);
/** Engage > Companies communication status (recruiter phase 1, N11). */
export const setCompanyCommunication = (name, status) => Api.put(`${W}/companies/communication`, { name, status });
export const getCompanyDetail = (name) => Api.get(`${W}/companies/detail`, { params: { name } });
/** "Company Memory": past roles/CTC/hires for a company, surfaced while creating a new drive for them. */
export const getCompanyHistory = (name) => Api.get(`${W}/companies/history`, { params: { name } });
/** Company picker on the drive form: 42's verified companies first, then this college's, then everyone else's (N3). */
export const searchCompanies = (q) => Api.get(`${W}/companies/search`, { params: { q } });
/** "Add other": finds the company by its website or recruiter email domain, or creates it unverified, and lists it here. */
export const resolveCompany = (body) => Api.post(`${W}/companies/resolve`, body);
/** The company's join link at this college and the trusted switch (recruiter phase 1, N5 b). */
export const getCompanyEngagement = (companyId) => Api.get(`${W}/companies/${companyId}/engagement`);
export const newCompanyJoinLink = (companyId) => Api.post(`${W}/companies/${companyId}/join-link`);
export const setCompanyTrusted = (companyId, trusted) => Api.put(`${W}/companies/${companyId}/trusted`, { trusted });
export const addCompanyDomain = (companyId, domain) => Api.post(`${W}/companies/${companyId}/domains`, { domain });

// --- Scheduling and drive day -----------------------------------------------------------------------
export const getSlots = (roundId) => Api.get(`${W}/rounds/${roundId}/slots`);
export const proposeSlots = (roundId, slots) => Api.post(`${W}/rounds/${roundId}/slots`, { slots });
export const confirmSlot = (roundId, slotId, room) => Api.post(`${W}/rounds/${roundId}/slots/${slotId}/confirm`, { room });
export const deleteSlot = (roundId, slotId) => Api.delete(`${W}/rounds/${roundId}/slots/${slotId}`);
export const clearUnbookedSlots = (roundId) => Api.delete(`${W}/rounds/${roundId}/slots`);
export const reorderRounds = (jobId, orderedIds) => Api.post(`${W}/drives/${jobId}/rounds/reorder`, { orderedIds });
export const getCandidates = (roundId) => Api.get(`${W}/rounds/${roundId}/candidates`);
export const previewAssignment = (roundId, rooms) => Api.post(`${W}/rounds/${roundId}/assignment/preview`, { rooms });
export const commitAssignment = (roundId, placed, notify) => Api.post(`${W}/rounds/${roundId}/assignment`, { placed, notify });
export const getAssignments = (roundId) => Api.get(`${W}/rounds/${roundId}/assignment`);
export const getRescheduleRequests = (roundId) => Api.get(`${W}/rounds/${roundId}/reschedule-requests`);
export const decideReschedule = (requestId, body) => Api.post(`${W}/reschedule-requests/${requestId}/decide`, body);
export const getRoster = (roundId) => Api.get(`${W}/drive-day/${roundId}/roster`);
export const searchRoster = (roundId, q) => Api.get(`${W}/drive-day/${roundId}/search`, { params: { q } });
export const markAttendance = (roundId, body) => Api.post(`${W}/drive-day/${roundId}/mark`, body);

// --- Messages, share, team, settings ------------------------------------------------------------------
export const getThreads = (jobId) => Api.get(`${W}/messages/threads`, { params: jobId ? { jobId } : {} });
export const getThread = (threadId) => Api.get(`${W}/messages/threads/${threadId}`);
/** { version }: changes with any new message or read in the college's conversations (live conversations, useLivePulse). */
export const getMessagesPulse = () => Api.get(`${W}/messages/pulse`);
export const sendMessage = (body) => Api.post(`${W}/messages`, body);
export const getShares = (jobId) => Api.get(`${W}/drives/${jobId}/shares`);
export const createShare = (jobId, body) => Api.post(`${W}/drives/${jobId}/shares`, body);
export const getShareEvents = (shareId) => Api.get(`${W}/shares/${shareId}/events`);
export const revokeShare = (shareId) => Api.post(`${W}/shares/${shareId}/revoke`);
export const getTeam = () => Api.get(`${W}/team`);
export const getFacultyDirectory = (q) => Api.get(`${W}/team/directory`, { params: { q } });
export const setTeamMember = (body) => Api.post(`${W}/team`, body);
export const getRemovalImpact = (facultyId) => Api.get(`${W}/team/${facultyId}/removal-impact`);
export const removeTeamMember = (facultyId, reassignTo) => Api.post(`${W}/team/${facultyId}/remove`, { reassignTo });
/** The top bar's season list: light, and readable by the whole placement team. */
export const getSeasonLens = () => Api.get(`${W}/lens/seasons`);
export const getSeasonSettings = () => Api.get(`${W}/settings/seasons`);
export const updateSeason = (seasonId, body) => Api.put(`${W}/settings/seasons/${seasonId}`, body);
export const getCollegeSettings = () => Api.get(`${W}/settings/college`);
export const saveCollegeSettings = (body) => Api.put(`${W}/settings/college`, body);
export const getMyPreferences = () => Api.get(`${W}/my-preferences`);
export const saveMyPreferences = (body) => Api.put(`${W}/my-preferences`, body);
export const getSavedViews = (scope) => Api.get(`${W}/views`, { params: { scope } });
export const saveView = (body) => Api.post(`${W}/views`, body);
export const deleteView = (id) => Api.delete(`${W}/views/${id}`);
/** Rename ({ name }), pin ({ pinned }) or replace the filters ({ filters }) of one of my views. */
export const updateView = (id, body) => Api.patch(`${W}/views/${id}`, body);
/** A view was opened or downloaded (for the recent list and the "not used" mark). */
export const markViewUsed = (id) => Api.post(`${W}/views/${id}/used`);

// --- Public share page (a company, no login) ------------------------------------------------------------
export const getShareInfo = (token) => Api.get(`/api/v1/public/share/${encodeURIComponent(token)}`);
export const openShare = (token, code) => Api.post(`/api/v1/public/share/${encodeURIComponent(token)}/open`, { code });
export const sendShareCode = (token) => Api.post(`/api/v1/public/share/${encodeURIComponent(token)}/send-code`);
export const downloadShareResumes = (token, code) =>
  Api.post(`/api/v1/public/share/${encodeURIComponent(token)}/resumes`, { code }, { responseType: "blob" });
export const logShareDownload = (token, code, kind) =>
  Api.post(`/api/v1/public/share/${encodeURIComponent(token)}/downloaded`, { code, kind });

// --- The student's own placement page ---------------------------------------------------------------------
const L = "/api/v1/learner";
export const getPlacementOverview = () => Api.get(`${L}/placement/overview`);
// Student redesign (14 Oct 2026): every application with its drive's rounds and where the student is in them, the schedule, offers.
export const getPlacementJourney = () => Api.get(`${L}/placement/journey`);
export const getDriveProcess = (jobId) => Api.get(`${L}/placement/drives/${jobId}/process`);
export const registerForPlacements = (choice, consent) => Api.post(`${L}/placement/register`, { choice, consent });
export const respondToTpoOffer = (offerId, accept) => Api.post(`${L}/offers/${offerId}/respond`, { accept });
export const getMyRounds = () => Api.get(`${L}/schedule`);
export const confirmMyRound = (roundId) => Api.post(`${L}/schedule/rounds/${roundId}/confirm`);
export const requestRoundReschedule = (roundId, reason, preferredTimes = null) =>
  Api.post(`${L}/schedule/rounds/${roundId}/reschedule-request`, { reason, ...(preferredTimes ? { preferredTimes } : {}) });
export const raiseStudentRequest = (body) => Api.post(`${L}/requests`, body);
export const getDriveEligibility = (jobId) => Api.get(`${L}/drives/${jobId}/eligibility`);
// Whether the student can apply, and if not why and what to do: registration, the drive's rules, held offers (the same gate as applying).
export const getApplyCheck = (jobId) => Api.get(`${L}/drives/${jobId}/apply-check`);
// The same gate for many drives at once: { [jobId]: { canApply, code, reason, action } }.
export const getApplyChecks = (ids) => Api.get(`${L}/drives/apply-checks`, { params: { ids: ids.join(",") } });
export const getCompanyPreview = (jobId) => Api.get(`${L}/drives/${jobId}/company-preview`);
export const getStudentCalendarExtras = (start, end, config) => {
  const params = new URLSearchParams({ start, end });
  return Api.get(`${L}/drives/calendar-extras?${params.toString()}`, config);
};
export const getPlacementRules = () => Api.get(`${L}/drives/placement-rules`);
export const getAcademicRecord = () => Api.get(`${L}/profile/academic-record`);
export const getDataAccessLog = () => Api.get(`${L}/profile/data-access`);

// Bulk-actions engine (components/tpo/bulk): exact undo and one audit line per run.
export const restoreRecruiterLeads = (rows) => Api.post(`${W}/recruiter-leads-hub/bulk/restore`, { rows });
export const restoreRegistrations = (rows) => Api.post(`${W}/students/bulk/restore-registration`, { rows });
export const recordBulk = (body) => Api.post(`${W}/bulk-record`, body);

// Settings > Job types and Settings > After college (TPO notes items 15 and 7).
export const getJobTypes = () => Api.get(`${W}/settings/job-types`);
export const saveJobTypes = (types) => Api.put(`${W}/settings/job-types`, types);
export const getCgpaRule = () => Api.get(`${W}/settings/cgpa-rule`);
export const saveCgpaRule = (rule) => Api.put(`${W}/settings/cgpa-rule`, { rule });
export const getOutcomeLabels = () => Api.get(`${W}/settings/outcome-labels`);
export const saveOutcomeLabels = (labels) => Api.put(`${W}/settings/outcome-labels`, labels);

// Announcements (N12): the placement cell to its students, 42 to placement cells, and the student's own list.
export const getMyAnnouncements = () => Api.get(`${W}/announcements`);
export const postAnnouncement = (body) => Api.post(`${W}/announcements`, body);
export const updateAnnouncement = (id, body) => Api.put(`${W}/announcements/${id}`, body);
export const deleteAnnouncement = (id) => Api.delete(`${W}/announcements/${id}`);
export const getAnnouncementsFrom42 = () => Api.get(`${W}/announcements/from-42`);
export const getStudentAnnouncements = () => Api.get("/api/v1/learner/placement/announcements");
// Announcements V2 (backend docs/tpo-announcements/ANNOUNCEMENTS-V2-2026-10-12.md): audience, reach, Undo, reads, reminders.
export const getAnnouncementAudiences = () => Api.get(`${W}/announcements/audiences`);
export const previewAnnouncementReach = (audience) => Api.post(`${W}/announcements/preview`, audience);
export const undoAnnouncement = (id) => Api.post(`${W}/announcements/${id}/undo`);
export const getAnnouncementUnreadBy = (id) => Api.get(`${W}/announcements/${id}/unread`);
export const remindAnnouncement = (id) => Api.post(`${W}/announcements/${id}/remind`);
export const getFrom42Unread = () => Api.get(`${W}/announcements/from-42/unread`);
export const getStudentAnnouncementsUnread = () => Api.get("/api/v1/learner/placement/announcements/unread");

// The placement team's conversations, asks, decisions and People (Team module V1, backend docs/tpo-team/TEAM-MODULE-DESIGN-2026-10-12.md).
// A message body carries @[Name](f:id), @[team](team) and #[Label](d|c|s:key) tokens; see components/tpo/team/teamTokens.js.
export const getTeamThreads = () => Api.get(`${W}/team/threads`);
export const searchTeamThreads = (q) => Api.get(`${W}/team/threads/search`, { params: { q } });
export const startTeamThread = (body) => Api.post(`${W}/team/threads`, body);
export const openTeamThread = (id) => Api.get(`${W}/team/threads/${id}`);
/** body: { body, askAssigneeId, askDueAt (UTC), decision, addPeople } */
export const sendTeamMessage = (id, body) => Api.post(`${W}/team/threads/${id}/messages`, typeof body === "string" ? { body } : body);
export const getTeamAbout = (kind, key) => Api.get(`${W}/team/threads/about`, { params: { kind, key } });
export const sendTeamAbout = (kind, key, body) => Api.post(`${W}/team/threads/about/messages`, body, { params: { kind, key } });
export const addTeamThreadPeople = (id, people) => Api.post(`${W}/team/threads/${id}/people`, { people });
export const followTeamThread = (id, on) => Api.post(`${W}/team/threads/${id}/follow`, { on });
export const muteTeamThread = (id, on) => Api.post(`${W}/team/threads/${id}/mute`, { on });
export const leaveTeamThread = (id) => Api.post(`${W}/team/threads/${id}/leave`);
export const updateTeamTopic = (id, body) => Api.put(`${W}/team/threads/${id}`, body);
export const editTeamMessage = (messageId, body, addPeople = false) => Api.put(`${W}/team/messages/${messageId}`, { body, addPeople });
export const deleteTeamMessage = (messageId) => Api.delete(`${W}/team/messages/${messageId}`);
export const markTeamDecision = (messageId, on) => Api.post(`${W}/team/messages/${messageId}/decision`, { on });
export const markTeamAskDone = (askId, note) => Api.post(`${W}/team/asks/${askId}/done`, { note: note || null });
export const cancelTeamAsk = (askId) => Api.post(`${W}/team/asks/${askId}/cancel`);
export const getMyTeamAsks = () => Api.get(`${W}/team/asks/mine`);
export const getMyTeamMentions = () => Api.get(`${W}/team/mentions`);
export const teamLookup = (q) => Api.get(`${W}/team/lookup`, { params: { q } });
export const getTeamPeople = () => Api.get(`${W}/team/people`);
export const setTeamAway = (facultyId, until) => Api.put(`${W}/team/people/${facultyId}/away`, { until: until || null });
export const assignUnowned = (body) => Api.post(`${W}/team/assign`, body);

// The college's public link for recruiters and whether they post directly (N5 a, N6).
export const getPublicLink = () => Api.get(`${W}/public-link`);
export const newPublicLink = () => Api.post(`${W}/public-link/new`);
export const savePublicLink = (body) => Api.put(`${W}/public-link`, body);

// The college's public placements page settings (D2).
export const getPlacementsPage = () => Api.get(`${W}/placements-page`);
export const savePlacementsPage = (body) => Api.put(`${W}/placements-page`, body);

// Email campaigns from Engage (phase 3).
export const listCampaigns = () => Api.get(`${W}/campaigns`);
export const sendCampaign = (body) => Api.post(`${W}/campaigns`, body);
