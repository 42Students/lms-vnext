import Api from "../ApiMethod";
import { API_URL } from "@/config/appConfig";
import { refreshAccessToken } from "@/utils/authUtils";
import { getApiErrorPresentation } from "@/utils/apiError";

let lastFileStreamCookieRefreshMs = 0;
const FILE_STREAM_COOKIE_REFRESH_INTERVAL_MS = 60 * 1000;

// ============ ORGANIZATION SETUP ============

// Organizations
export const createOrganization = (data) =>
  Api.post("/api/v1/organization/create", data);

export const getOrganizations = () =>
  Api.get("/api/v1/organization/fetch");

export const getOrganizationById = (id) =>
  Api.get(`/api/v1/organization/fetch/${id}`);

export const updateOrganization = (id, data) =>
  Api.put(`/api/v1/organization/update/${id}`, data);

export const deleteOrganization = (id) =>
  Api.delete(`/api/v1/organization/delete/${id}`);

// Colleges
export const createCollege = (data) =>
  Api.post("/api/v1/college/create", data);

export const getColleges = (config) =>
  Api.get("/api/v1/college/fetchCollegeList", config);



export const getCollegeById = (id) =>
  Api.get(`/api/v1/college/fetchCollege?collegeId=${id}`);

export const updateCollege = (id, data) =>
  Api.put(`/api/v1/college/update/${id}`, data);

export const deleteCollege = (id) =>
  Api.delete(`/api/v1/college/delete/${id}`);

// College feature flags (Projects / Placements, superadmin-managed)
// The modules this deployment can toggle, from the server's ModuleFeatureCatalog — so the
// console never offers a toggle the server would reject, or misses one it supports.
export const getFeatureModules = () => Api.get(`/api/v1/superadmin/features/modules`);

export const getCollegeFeatureFlags = () =>
  Api.get("/api/v1/superadmin/features");

export const updateCollegeFeatureFlag = (collegeId, module, enabled) =>
  Api.put(`/api/v1/superadmin/features/${collegeId}`, { module, enabled });

// How many mentors are actively assigned to a project at this college — used to warn before
// disabling Projects, since a mentor's sidebar has nothing left to hide behind once it's off.
export const getMentorCountForCollege = (collegeId) =>
  Api.get(`/api/v1/superadmin/features/${collegeId}/mentor-count`);

export const getPlacementsImpactForCollege = (collegeId) =>
  Api.get(`/api/v1/superadmin/features/${collegeId}/placements-impact`);

// Hierarchical module access (learner → class → batch → program → department → college → org →
// global). Same endpoints for both consoles; authority per level is enforced server-side.
export const getModuleAccessNode = (scopeType, scopeId) =>
  Api.get(`/api/v1/admin/module-access`, { params: { scopeType, scopeId } });

// The whole college — every department, program, batch and class with all three modules already
// resolved — in one call. Backs the grid, so an admin sees where every setting lives rather than
// drilling a picker to discover it.
export const getModuleAccessTree = (collegeId) =>
  Api.get(`/api/v1/admin/module-access/tree`, { params: { collegeId } });

// `enabled: null` clears the override at this node so it inherits again — a distinct third state
// from true/false, which is why the UI control is tri-state. `locked` is super-admin only.
export const setModuleAccess = ({ scopeType, scopeId, module, enabled, locked }) =>
  Api.put(`/api/v1/admin/module-access`, { scopeType, scopeId, module, enabled, locked });

export const setModuleAccessBulk = ({ module, enabled, learnerIds }) =>
  Api.put(`/api/v1/admin/module-access/bulk`, { module, enabled, learnerIds });

// Which students carry their own override. Per-student settings are the narrowest level and
// always win, so a forgotten one follows a student for years — and they are the one level the grid
// cannot display.
export const getLearnerModuleOverrides = (collegeId) =>
  Api.get(`/api/v1/admin/module-access/learner-overrides`, { params: { collegeId } });

// "Why can't this student see Placements?" — resolved value plus the level that decided it.
export const explainModuleAccess = (learnerId) =>
  Api.get(`/api/v1/admin/module-access/explain`, { params: { learnerId } });

export const getModuleAccessHistory = (collegeId, limit = 50) =>
  Api.get(`/api/v1/admin/module-access/history`, { params: { collegeId, limit } });

// Departments
export const createDepartment = (data) =>
  Api.post("/api/v1/department/create", data);

export const getDepartments = () =>
  Api.get("/api/v1/department/fetchAll");

export const getDepartmentsByCollege = (collegeId) =>
  Api.get(`/api/v1/department/fetch?collegeId=${collegeId}`);

export const updateDepartment = (id, data) =>
  Api.put(`/api/v1/department/update/${id}`, data);

export const deleteDepartment = (id) =>
  Api.delete(`/api/v1/department/delete/${id}`);

// ============ ACADEMIC STRUCTURE ============

// Programs (using new_program table)
// CRITICAL FIX: Use the old program API that creates in 'program' table
// The new-program API creates in 'new_program' table which job validation doesn't query
export const createProgram = (data) =>
  Api.post("/api/v1/program/create", data);

export const getPrograms = () =>
  Api.get("/api/v1/new-program/fetchAll");

export const getProgramsByDepartment = (deptId) =>
  Api.get(`/api/v1/new-program/fetchByDept?deptId=${deptId}`);

export const getProgramsByCollege = (collegeId) =>
  Api.get(`/api/v1/new-program/fetchByCollege?collegeId=${collegeId}`);

export const getProgramById = (id) =>
  Api.get(`/api/v1/new-program/fetch/${id}`);

export const updateProgram = (id, data) =>
  Api.put(`/api/v1/new-program/update/${id}`, data);

export const deleteProgram = (id) =>
  Api.delete(`/api/v1/new-program/delete/${id}`);

// Batches
export const createBatch = (data) =>
  Api.post("/api/v1/batch/create", data);

export const getBatches = () =>
  Api.get("/api/v1/batch/fetch");

export const getBatchesByCollege = (collegeId) =>
  Api.get(`/api/v1/batch/fetchByCollege?collegeId=${collegeId}`);

export const getBatchesByProgram = (programId) =>
  Api.get(`/api/v1/batch/fetchByProgram?programId=${programId}`);

export const getBatchById = (batchId) =>
  Api.get(`/api/v1/batch/getBranchDetailsById?batchId=${batchId}`);

export const promoteBatch = (batchId, data = {}) =>
  Api.post(`/api/v1/batch/${batchId}/promote`, data);

export const previewBatchPromotion = (batchId, targetSemester) =>
  Api.get(`/api/v1/batch/${batchId}/promote/preview${targetSemester != null ? `?targetSemester=${targetSemester}` : ""}`);

export const updateBatchSemester = (batchId, semesterNumber) =>
  Api.put(`/api/v1/batch/${batchId}/semester?semesterNumber=${semesterNumber}`);

export const updateBatch = (id, data) =>
  Api.put(`/api/v1/batch/update/${id}`, data);

export const deleteBatch = (id) =>
  Api.delete(`/api/v1/batch/delete/${id}`);

// Classes
export const createClass = (data) =>
  Api.post("/api/v1/class/create", data);

export const getClasses = () =>
  Api.get("/api/v1/class/getClass");

export const getClassesByCollege = (collegeId, options = {}) => {
  const params = new URLSearchParams();
  params.set("collegeId", collegeId);
  if (options.search && String(options.search).trim()) {
    params.set("search", String(options.search).trim());
  }
  return Api.get(`/api/v1/class/getClassesByCollege?${params.toString()}`);
};

export const getClassesByProgram = (programId) =>
  Api.get(`/api/v1/class/getClass?programId=${programId}`);

// The /getClass controller method only binds a `classId` query param and silently ignores an
// unrecognized `programId` one, so getClassesByProgram() above actually returns every class in
// the admin's whole college regardless of which program was asked for — fine for its one existing
// caller (Students.js bulk-assign, which just needs *a* class list to populate a Select), but
// wrong for anything that needs a program-scoped COUNT (e.g. a per-program dependency chip that
// gates delete). This hits the backend's real /getClassesByProgram endpoint (which does filter)
// and normalizes its `{id: name}` map response down to a plain count, 0 when the backend 404s for
// "no classes found" rather than treating that as a failed fetch.
export const getClassCountByProgram = (programId) =>
  Api.get(`/api/v1/class/getClassesByProgram?programId=${programId}`)
    .then((res) => ({ ...res, data: { ...res.data, data: Object.keys(res?.data?.data ?? {}).length } }))
    .catch((err) => {
      if (err?.response?.status === 404) return { data: { data: 0 } };
      throw err;
    });

export const updateClass = (id, data) =>
  Api.put(`/api/v1/class/update/${id}`, data);

export const deleteClass = (id) =>
  Api.delete(`/api/v1/class/delete/${id}`);

// ============ USER MANAGEMENT ============

// Faculty
export const registerFaculty = (data) =>
  Api.post("/api/v1/faculty/register", data);

/** Body: { mobiles: string[], emails?: string[], college_id }. Returns { existing_mobiles, existing_emails } from faculty table. */
export const bulkValidateFaculty = (data) =>
  Api.post("/api/v1/faculty/bulk-validate", data);

/** Body: { college_id, faculty: [{ first_name, last_name, contact_mobile, dept_id, contact_mail? }] }. */
export const bulkRegisterFaculty = (data) =>
  Api.post("/api/v1/faculty/bulk-register", data);

export const getFacultyList = () =>
  Api.get("/api/v1/faculty/getAllFaculty");

export const getFacultyByDepartment = (deptId) =>
  Api.get(`/api/v1/faculty/getFacultyByDeptId?deptId=${deptId}`);

// Dashboard "at a glance" numbers -- count queries server-side, never a full list fetch.
// Operational dashboard: attendance not taken, at-risk students, grading backlog, unstaffed courses,
// setup gaps, quizzes closing this week (AdminCollegeDashboardController).
export const getAdminCollegeDashboard = (collegeId) =>
  Api.get(`/api/v1/admin/college-dashboard?collegeId=${collegeId}`);

export const getAdminCollegeSummary = (collegeId) =>
  Api.get(`/api/v1/admin/college-summary?collegeId=${collegeId}`);

export const getFacultyByCollegeId = (collegeId, options = {}) => {
  const params = new URLSearchParams();
  params.set("collegeId", collegeId);
  if (options.search && String(options.search).trim()) {
    params.set("search", String(options.search).trim());
  }
  return Api.get(`/api/v1/faculty/getFacultyByCollegeId?${params.toString()}`);
};

export const getFacultyDetails = (phoneNumber) =>
  Api.get(`/api/v1/faculty/getInstructorDetails?phoneNumber=${phoneNumber}`);

export const updateFaculty = (id, data) =>
  Api.put(`/api/v1/faculty/update/${id}`, data);

export const deleteFaculty = (id) =>
  Api.delete(`/api/v1/faculty/delete/${id}`);

// Students/Learners
export const registerLearner = (data) =>
  Api.post("/api/v1/learner/register", data);

/** Body: { mobiles: string[], emails?: string[], college_id }. Returns { existing_mobiles, existing_emails }. */
export const bulkValidateLearners = (data) =>
  Api.post("/api/v1/learner/bulk-validate", data);

/** Body: { college_id, program_id, class_id, learners: [{ first_name, last_name, roll_number, contact_mobile, contact_mail? }] }. */
export const bulkRegisterLearners = (data) =>
  Api.post("/api/v1/learner/bulk-register", data);

// B3 in the audit -- "a bad bulk import has no undo."
export const getBulkImportBatches = (collegeId) =>
  Api.get(`/api/v1/learner/bulk-imports?collegeId=${collegeId}`);

export const undoBulkImport = (batchId, collegeId) =>
  Api.post(`/api/v1/learner/bulk-imports/${encodeURIComponent(batchId)}/undo?collegeId=${collegeId}`);

export const getLearnerList = () =>
  Api.get("/api/v1/learner/getAllLearners");

export const getLearnersByCollegeId = (collegeId, options = {}) => {
  const params = new URLSearchParams();
  params.set("collegeId", collegeId);
  if (options.search && String(options.search).trim()) {
    params.set("search", String(options.search).trim());
  }
  return Api.get(`/api/v1/learner/getLearnersByCollegeId?${params.toString()}`);
};

export const getLearnersByClass = (classId) =>
  Api.get(`/api/v1/learner/getLearnerDetailsByClassId?classId=${classId}`);

export const getLearnersByProgram = (programId) =>
  Api.get(`/api/v1/users/learnerContactsByProgramId?programId=${programId}`);

export const updateLearner = (id, data) =>
  Api.put(`/api/v1/learner/update/${id}`, data);

export const moveLearnerClass = (id, targetClassId) =>
  Api.put(`/api/v1/learner/${id}/move-class`, { target_class_id: targetClassId });

export const deleteLearner = (id) =>
  Api.delete(`/api/v1/learner/delete/${id}`);

// ============ COURSE MANAGEMENT ============

// Courses
export const createCourse = (data) =>
  Api.post("/api/v1/courses/create", data);

export const getCourses = () =>
  Api.get("/api/v1/courses/fetchAll");

export const getCoursesByCollege = (collegeId) =>
  Api.get(`/api/v1/courses/fetchByCollege?collegeId=${collegeId}`);

export const getCoursesByDepartment = (deptId) =>
  Api.get(`/api/v1/courses/fetch?deptId=${deptId}`);

export const getCourseById = (courseId) =>
  Api.get(`/api/v1/courses/fetchCourse?courseId=${courseId}`);

/**
 * Get course name by slug (preferred - does not expose course ID)
 * @param {string} slug - Course slug (e.g. crs-X9kMn3...)
 * @returns {Promise} Resolves to course name or null
 */
export const getCourseNameBySlug = (slug) =>
  Api.get(`/api/v1/courses/by-slug/${encodeURIComponent(slug)}`).then(
    (res) => res?.data?.data?.course_name ?? res?.data?.data?.courseName ?? null
  );

export const updateCourse = (id, data) =>
  Api.put(`/api/v1/courses/update/${id}`, data);

export const deleteCourse = (id) =>
  Api.delete(`/api/v1/courses/delete/${id}`);

export const getDeletedCourses = (collegeId) =>
  Api.get(`/api/v1/courses/deleted?collegeId=${collegeId}`);

export const restoreCourse = (id, collegeId) =>
  Api.post(`/api/v1/courses/restore/${id}?collegeId=${collegeId}`);

// Projects
export const createProject = (data) =>
  Api.post("/api/v1/admin/projects", data);

export const previewBulkCreateProjects = (data) =>
  Api.post("/api/v1/admin/projects/bulk/preflight", data);

export const bulkCreateProjects = (data) =>
  Api.post("/api/v1/admin/projects/bulk", data);

// Project teams on groups: one workspace + one PROJECT_TEAM group per team (docs/groups/PROJECT-TEAMS.md).
export const createProjectTeams = (data) =>
  Api.post("/api/v1/admin/projects/teams", data);

// Repairs a team workspace's member rows from its team group (hand edits in the database).
export const reconcileProjectTeam = (projectId, collegeId) =>
  Api.post(`/api/v1/admin/projects/${encodeURIComponent(projectId)}/team/reconcile?collegeId=${collegeId}`);

export const updateProject = (projectId, collegeId, data) =>
  Api.put(`/api/v1/admin/projects/${encodeURIComponent(projectId)}?collegeId=${collegeId}`, data);

const buildQuery = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, value);
    }
  });
  return search.toString();
};

export const getProjectsByCollege = (collegeId, params = {}) =>
  Api.get(`/api/v1/admin/projects?${buildQuery({ collegeId, ...params })}`);

// Paginated variant — the plain getProjectsByCollege above fetches the whole college's
// workspace list unbounded, which doesn't scale once a college has thousands of workspaces.
export const getProjectsByCollegePage = (collegeId, params = {}) =>
  Api.get(`/api/v1/admin/projects/page?${buildQuery({ collegeId, ...params })}`);

export const getDeletedProjectsByCollege = (collegeId, params = {}) =>
  Api.get(`/api/v1/admin/projects/deleted?${buildQuery({ collegeId, ...params })}`);

export const restoreProject = (projectId, collegeId) =>
  Api.post(`/api/v1/admin/projects/${encodeURIComponent(projectId)}/restore?collegeId=${collegeId}`);

export const getProjectWorkspaceById = (projectId, collegeId) =>
  Api.get(`/api/v1/admin/projects/${encodeURIComponent(projectId)}?collegeId=${collegeId}`);

export const getProjectTemplatesByCollege = (collegeId, params = {}) =>
  Api.get(`/api/v1/admin/project-templates?${buildQuery({ collegeId, ...params })}`);

// Templates are a global catalog now (V136__project_template_global.sql) — super-admin calls
// these with no college selected at all, so collegeId can genuinely be null/undefined here.
// buildQuery drops nullish values; the raw `?collegeId=${collegeId}` template-string these used
// to use would instead send the literal string "collegeId=undefined", which the backend's
// Integer-typed @RequestParam fails to parse (400), rather than the "not sent" it needs to mean.
export const getProjectTemplateById = (templateId, collegeId) =>
  Api.get(`/api/v1/admin/project-templates/${encodeURIComponent(templateId)}?${buildQuery({ collegeId })}`);

export const getProjectTemplatePreview = (templateId, collegeId) =>
  Api.get(`/api/v1/admin/project-templates/${encodeURIComponent(templateId)}/preview?${buildQuery({ collegeId })}`);

export const getProjectTemplateVersions = (templateId, collegeId) =>
  Api.get(`/api/v1/admin/project-templates/${encodeURIComponent(templateId)}/versions?${buildQuery({ collegeId })}`);

export const getProjectTemplateVersionsPage = (templateId, collegeId, params = {}) =>
  Api.get(`/api/v1/admin/project-templates/${encodeURIComponent(templateId)}/versions/page?${buildQuery({ collegeId, ...params })}`);

export const getAssignedCollegeIdsForProjectTemplate = (templateId) =>
  Api.get(`/api/v1/admin/project-templates/${encodeURIComponent(templateId)}/colleges`);

// expectedCollegeIds: the set the caller last read; the server refuses (409) if it has changed since.
export const bulkSetProjectTemplateColleges = (templateId, collegeIds, expectedCollegeIds) =>
  Api.put(`/api/v1/admin/project-templates/${encodeURIComponent(templateId)}/colleges`, { collegeIds, ...(expectedCollegeIds ? { expectedCollegeIds } : {}) });

export const createProjectTemplate = (data) =>
  Api.post("/api/v1/admin/project-templates", data);

export const updateProjectTemplate = (templateId, collegeId, data) =>
  Api.put(`/api/v1/admin/project-templates/${encodeURIComponent(templateId)}?${buildQuery({ collegeId })}`, data);

export const duplicateProjectTemplate = (templateId, collegeId, data = null) =>
  Api.post(`/api/v1/admin/project-templates/${encodeURIComponent(templateId)}/duplicate?${buildQuery({ collegeId })}`, data ?? {});

export const createProjectFromTemplate = (templateId, data) =>
  Api.post(`/api/v1/admin/project-templates/${encodeURIComponent(templateId)}/projects`, data);

export const archiveProjectTemplate = (templateId, collegeId) =>
  Api.delete(`/api/v1/admin/project-templates/${encodeURIComponent(templateId)}?${buildQuery({ collegeId })}`);

// Opt-in per-college template visibility (V140__project_template_college_assignment.sql) —
// super-admin only.
export const assignProjectTemplateToCollege = (templateId, collegeId) =>
  Api.post(`/api/v1/admin/project-templates/${encodeURIComponent(templateId)}/colleges/${encodeURIComponent(collegeId)}`);

export const unassignProjectTemplateFromCollege = (templateId, collegeId) =>
  Api.delete(`/api/v1/admin/project-templates/${encodeURIComponent(templateId)}/colleges/${encodeURIComponent(collegeId)}`);

export const getAssignedProjectTemplateIdsForCollege = (collegeId) =>
  Api.get(`/api/v1/admin/project-templates/colleges/${encodeURIComponent(collegeId)}`);

export const assignProjectMentor = (projectId, data) =>
  Api.post(`/api/v1/admin/projects/${encodeURIComponent(projectId)}/mentor`, data);

export const bulkReassignProjectMentor = (data) =>
  Api.post(`/api/v1/admin/projects/reassign-mentor/bulk`, data);

export const attachProjectTemplate = (projectId, data) =>
  Api.post(`/api/v1/admin/projects/${encodeURIComponent(projectId)}/template`, data);

export const assignProjectLearners = (projectId, data) =>
  Api.post(`/api/v1/admin/projects/${encodeURIComponent(projectId)}/learners`, data);

export const archiveProject = (projectId, collegeId) =>
  Api.post(`/api/v1/admin/projects/${encodeURIComponent(projectId)}/archive?collegeId=${collegeId}`);

export const deleteProject = (projectId, collegeId) =>
  Api.post(`/api/v1/admin/projects/${encodeURIComponent(projectId)}/delete?collegeId=${collegeId}`);

export const getProjectReadiness = (projectId, collegeId) =>
  Api.get(`/api/v1/admin/projects/${encodeURIComponent(projectId)}/readiness?collegeId=${collegeId}`);

// Previously the only release visibility an admin had anywhere was the aggregate "X/Y shipped"
// count on the readiness response — no titles, no dates, no per-release status.
export const getProjectReleases = (projectId, collegeId) =>
  Api.get(`/api/v1/admin/projects/${encodeURIComponent(projectId)}/releases?collegeId=${collegeId}`);

export const overrideProjectReadiness = (projectId, data) =>
  Api.post(`/api/v1/admin/projects/${encodeURIComponent(projectId)}/readiness/override`, data);

export const getProjectAuditLog = (collegeId, params = {}) =>
  Api.get(`/api/v1/admin/projects/audit?${buildQuery({ collegeId, ...params })}`);

export const getProjectResourceAudit = (projectId, collegeId) =>
  Api.get(`/api/v1/admin/projects/${encodeURIComponent(projectId)}/resource-audit?collegeId=${collegeId}`);

export const publishProjectTemplate = (templateId, collegeId) =>
  Api.post(`/api/v1/admin/project-templates/${encodeURIComponent(templateId)}/publish?${buildQuery({ collegeId })}`);

export const unpublishProjectTemplate = (templateId, collegeId) =>
  Api.post(`/api/v1/admin/project-templates/${encodeURIComponent(templateId)}/unpublish?${buildQuery({ collegeId })}`);

// M5 in the audit -- attendance was the only module with no write capability at all in the
// console. Both bypass the retroactive-marking window (that's the point of an admin correction).
export const adminMarkAbsent = (collegeId, { studentId, classScheduleId, dropClassReason, status } = {}) =>
  Api.post(
    `/api/v1/admin/attendance/mark-absent?${buildQuery({ collegeId, status })}`,
    {
      student_id: studentId,
      class_schedule_id: classScheduleId,
      drop_class_reason: dropClassReason,
    },
  );

// W2: "can't see who marked it". Returns the marker, the reason (EXCUSED/MEDICAL/LATE or plain
// ABSENT) and when — for one student/session, looked up on demand rather than bloating the grid.
export const adminGetAttendanceRecord = (collegeId, studentId, classScheduleId) =>
  Api.get(`/api/v1/admin/attendance/record?${buildQuery({ collegeId, studentId, classScheduleId })}`);

export const adminMarkPresent = (collegeId, studentId, classScheduleId) =>
  Api.post(`/api/v1/admin/attendance/mark-present?${buildQuery({ collegeId, studentId, classScheduleId })}`);

// W3 in the audit -- "a student can't log in" had no admin-triggered fix at any layer. Clears the
// OTP rate-limit lockout for a phone number so the user can request their own OTP again.
export const clearOtpLockout = (phoneNumber) =>
  Api.post(`/users/admin/clear-otp-lockout?${buildQuery({ phoneNumber })}`);

// W1 in the audit -- a departed faculty member's remaining timetable had no way to be reassigned.
// Moves every not-yet-started class schedule from oldFacultyId to newFacultyId in one action.
// Part B "Class scheduling: create a recurring series" — generates one session per matching
// weekday in the range, each through the normal single-session create so conflicts are detected
// and reported per date instead of aborting the whole series.
// M2 "see delivery status, resend or retry" — the operator side of scheduled notifications.
export const resendNotification = (id, collegeId) =>
  Api.post(`/api/v1/admin/notification-delivery/${id}/resend?collegeId=${collegeId}`);

export const cancelNotificationSchedule = (id, collegeId) =>
  Api.post(`/api/v1/admin/notification-delivery/${id}/cancel-schedule?collegeId=${collegeId}`);

export const createRecurringClassSchedule = (collegeId, payload) =>
  Api.post(`/api/v1/admin/class-schedule/recurring?collegeId=${collegeId}`, payload);

export const bulkReassignFacultySchedule = (oldFacultyId, newFacultyId) =>
  Api.post(`/api/v1/scheduleClass/bulk-reassign-faculty?${buildQuery({ oldFacultyId, newFacultyId })}`);

// M3 "see rollback blast radius" — read before confirming a rollback. A rollback rewrites what
// every attached cohort sees, because workspaces resolve their virtual sections from the
// currently attached template on every read.
// Part B "Courses: any bulk operation" — sets any combination of active, enabled and
// allowedForDisplay across many courses, reporting per-course failures.
// The Lessons half of the same audit finding ("Courses / Lessons: any bulk operation").
// Status only — bulk delete is deliberately absent, because deleting a lesson permanently
// destroys its uploaded files from object storage.
export const bulkUpdateLessonStatus = (payload) =>
  Api.post(`/api/v1/admin/lessons/bulk-status`, payload);

// Course audit pass 2: how far a class has got through a course. There was no aggregate progress
// anywhere in the product — the data existed per learner per item and only the learner's own
// screens read it.
export const getCourseProgress = (courseId, classId) =>
  Api.get(`/api/v1/admin/course-progress?courseId=${courseId}&classId=${classId}`);

export const bulkUpdateCourseStatus = (payload) =>
  Api.post(`/api/v1/admin/courses/bulk-status`, payload);

export const getProjectTemplateImpact = (templateId, collegeId) =>
  Api.get(`/api/v1/admin/project-templates/${encodeURIComponent(templateId)}/impact?${buildQuery({ collegeId })}`);

// expectedTemplateVersion: the templateVersion the admin compared against (a newer save makes the rollback a 409).
export const rollbackProjectTemplateVersion = (templateId, versionId, collegeId, expectedTemplateVersion) =>
  Api.post(`/api/v1/admin/project-templates/${encodeURIComponent(templateId)}/versions/${encodeURIComponent(versionId)}/rollback?${buildQuery({ collegeId, expectedTemplateVersion })}`);

// "Migrate legacy workspaces" (backfilling pre-template-system workspaces onto the template
// system) was removed entirely — frontend UI, this export and the backend endpoint it called
// (POST /api/v1/admin/project-templates/migrate/workspaces).

// Lessons
export const createLesson = (data) =>
  Api.post("/api/v1/lesson/create", data);

export const getLessonsByCourse = (courseId) =>
  Api.get(`/api/v1/lesson/fetch?courseId=${courseId}`);

/**
 * Get lessons by course slug (preferred - does not expose course ID)
 * @param {string} courseSlug - Course slug (e.g. crs-X9kMn3...)
 */
export const getLessonsByCourseSlug = (courseSlug) =>
  Api.get(`/api/v1/lesson/fetch?courseSlug=${encodeURIComponent(courseSlug)}`);

export const getAllLessons = () =>
  Api.get("/api/v1/lesson/fetchAll");

export const updateLesson = (id, data) =>
  Api.put(`/api/v1/lesson/update/${id}`, data);

export const deleteLesson = (id) =>
  Api.delete(`/api/v1/lesson/delete/${id}`);

export const getDeletedLessons = (collegeId) =>
  Api.get(`/api/v1/lesson/deleted?collegeId=${collegeId}`);

// Restoring a lesson does NOT restore its content rows or any uploaded file already destroyed
// by the original delete's best-effort R2 cleanup — see LessonServiceImpl#restoreLesson.
export const restoreLesson = (id, collegeId) =>
  Api.post(`/api/v1/lesson/restore/${id}?collegeId=${collegeId}`);

// Lesson Contents
export const createLessonContent = (data) =>
  Api.post("/api/v1/lesson/contents/create", data);

// Use fetch endpoint which gets all contents for a lesson (not fetchSpecificLessonContents which needs classId)
export const getLessonContents = (lessonId) =>
  Api.get(`/api/v1/lesson/contents/fetch?lessonId=${lessonId}`);

export const getLessonContentById = (id) =>
  Api.get(`/api/v1/lesson/contents/fetchById/${id}`);

export const updateLessonContent = (id, data) =>
  Api.put(`/api/v1/lesson/contents/update/${id}`, data);

export const deleteLessonContent = (id) =>
  Api.delete(`/api/v1/lesson/contents/delete/${id}`);

/**
 * Update per-class content order for a lesson. Admin/faculty only.
 * Reordering affects only the specified class.
 * @param {{ lessonId: number, classId: number, orderedContentIds: number[] }} body
 */
// Reorders a course's lessons in one request. Sequence was a number typed into a modal, one
// lesson at a time, so reordering a twelve-lesson course meant twelve modals — and a mistake left
// two lessons sharing a position with nothing on screen showing it.
export const reorderLessons = (courseId, lessonIds) =>
  Api.put(`/api/v1/lesson/reorder`, { courseId, lessonIds });

export const updateClassContentOrder = (body) =>
  Api.put("/api/v1/lesson/contents/class-content-order", body);

// ============ INFRASTRUCTURE ============

// Lecture Halls
export const createLectureHall = (data) =>
  Api.post("/api/v1/lectureHall/create", data);

export const getLectureHalls = () =>
  Api.get("/api/v1/lectureHall/fetch");

export const getLectureHallById = (id) =>
  Api.get(`/api/v1/lectureHall/fetch/${id}`);

export const getLectureHallsByCollege = (collegeId) =>
  Api.get(`/api/v1/lectureHall/fetchByCollege?collegeId=${collegeId}`);

export const getLectureHallsByDept = (deptId) =>
  Api.get(`/api/v1/lectureHall/fetchByDept?deptId=${deptId}`);

export const updateLectureHall = (id, data) =>
  Api.put(`/api/v1/lectureHall/update/${id}`, data);

export const deleteLectureHall = (id) =>
  Api.delete(`/api/v1/lectureHall/delete/${id}`);

// ============ 42's COMPANY LIST (super admin, recruiter phase 1 N3) ============
const SC = "/api/v1/superadmin/companies";
export const listCuratedCompanies = (params) => Api.get(SC, { params });
export const setCompanyVerified = (id, verified) => Api.post(`${SC}/${id}/verify`, { verified });
export const updateCuratedCompany = (id, body) => Api.put(`${SC}/${id}`, body);
export const addCompanyDomain = (id, domain) => Api.post(`${SC}/${id}/domains`, { domain });
export const removeCompanyDomain = (id, domain) => Api.delete(`${SC}/${id}/domains/${encodeURIComponent(domain)}`);
export const mergeCompany = (id, intoCompanyId) => Api.post(`${SC}/${id}/merge`, { intoCompanyId });
// Other names a company goes by ("TCS"): the TPO's company search finds it by them.
export const addCompanyAlias = (id, alias) => Api.post(`${SC}/${id}/aliases`, { alias });
export const removeCompanyAlias = (id, alias) => Api.delete(`${SC}/${id}/aliases`, { params: { alias } });

// ============ ADMIN COMPANIES (College-Scoped) ============
// Reusable company records — create once, reuse across job postings.

export const getAdminCompanies = (collegeId, includeDeleted = false, config) =>
  Api.get(`/api/v1/admin/companies?collegeId=${collegeId}${includeDeleted ? "&includeDeleted=true" : ""}`, config);

export const getAdminCompanyById = (companyId, collegeId) =>
  Api.get(`/api/v1/admin/companies/${companyId}?collegeId=${collegeId}`);

export const getAdminCompanyJobs = (companyId, collegeId) =>
  Api.get(`/api/v1/admin/companies/${companyId}/jobs?collegeId=${collegeId}`);

export const getAdminCompanyStats = (companyId, collegeId) =>
  Api.get(`/api/v1/admin/companies/${companyId}/stats?collegeId=${collegeId}`);

export const createAdminCompany = (company, collegeId) => {
  const cid = collegeId != null ? Number(collegeId) : NaN;
  if (Number.isNaN(cid) || cid <= 0) {
    return Promise.reject(new Error("collegeId must be a positive number"));
  }
  return Api.post(`/api/v1/admin/companies?collegeId=${cid}`, company);
};

export const updateAdminCompany = (companyId, company, collegeId) => {
  const cid = collegeId != null ? Number(collegeId) : NaN;
  if (Number.isNaN(cid) || cid <= 0) {
    return Promise.reject(new Error("collegeId must be a positive number"));
  }
  return Api.put(`/api/v1/admin/companies/${companyId}?collegeId=${cid}`, company);
};

// Drives landing page's capped, cross-drive "needs attention" queue.
export const getAdminNeedsAttentionSummary = (collegeId, config) =>
  Api.get(`/api/v1/admin/jobs/needs-attention?collegeId=${collegeId}`, config);

// Stale REJECTED/WITHDRAWN application report — read-only, does not delete anything. Had a
// working backend endpoint with zero frontend caller anywhere in the app before this.
export const getAdminDataRetentionReport = (collegeId, olderThanDays, config) => {
  const params = new URLSearchParams({ collegeId: String(collegeId) });
  if (olderThanDays != null) params.set("olderThanDays", String(olderThanDays));
  return Api.get(`/api/v1/admin/jobs/data-retention-report?${params.toString()}`, config);
};

// "Where does this student stand?" — every application (any job) for one student in one call.
export const getAdminStudentPlacementSummary = (learnerId, collegeId, config) =>
  Api.get(`/api/v1/admin/jobs/students/${learnerId}/placement-summary?collegeId=${collegeId}`, config);

export const deleteAdminCompany = (companyId, collegeId) => {
  if (!companyId || !collegeId) return Promise.reject(new Error("companyId and collegeId are required"));
  return Api.delete(`/api/v1/admin/companies/${companyId}?collegeId=${collegeId}`);
};

export const restoreAdminCompany = (companyId, collegeId) => {
  if (!companyId || !collegeId) return Promise.reject(new Error("companyId and collegeId are required"));
  return Api.post(`/api/v1/admin/companies/${companyId}/restore?collegeId=${collegeId}`);
};

// ============ ADMIN JOBS (College-Scoped) ============

export const getJobsByCollege = (collegeId, config) =>
  Api.get(`/api/v1/admin/jobs?collegeId=${collegeId}`, config);

export const getAdminJobById = (jobId, collegeId) =>
  Api.get(`/api/v1/admin/jobs/${jobId}?collegeId=${collegeId}`);

export const createAdminJob = (job, collegeId) => {
  const cid = collegeId != null ? Number(collegeId) : NaN;
  if (Number.isNaN(cid) || cid <= 0) {
    return Promise.reject(new Error("collegeId must be a positive number"));
  }
  // createdBy is derived from JWT on the server; do not pass from client
  return Api.post(`/api/v1/admin/jobs?collegeId=${cid}`, job);
};

export const updateAdminJob = (jobId, job, collegeId) => {
  const cid = collegeId != null ? Number(collegeId) : NaN;
  if (Number.isNaN(cid) || cid <= 0) {
    return Promise.reject(new Error("collegeId must be a positive number"));
  }
  return Api.put(`/api/v1/admin/jobs/${jobId}?collegeId=${cid}`, job);
};

// Extends a drive's application deadline in one call. applicationDeadline is derived from the
// "Application deadline" entry inside importantDates on every save — setting the field directly
// through the raw update endpoint would appear to work and then silently revert on the next save.
// This moves the underlying entry instead, so the two agree.
export const extendJobDeadline = (jobId, newDeadline, collegeId) => {
  if (!jobId || !collegeId) return Promise.reject(new Error("jobId and collegeId are required"));
  return Api.post(`/api/v1/admin/jobs/${jobId}/extend-deadline?collegeId=${collegeId}`, { newDeadline });
};

export const setAdminJobStatus = (jobId, isActive, collegeId) => {
  if (!jobId || !collegeId) return Promise.reject(new Error("jobId and collegeId are required"));
  return Api.post(`/api/v1/admin/jobs/${jobId}/status?collegeId=${collegeId}`, { isActive });
};

/**
 * Server-side paginated/filtered/searched drive list, for the "All Drives" browse-everything
 * view — unlike getJobsByCollege, which fetches the whole college history unbounded.
 * @param {Object} params - { page, size, status: "all"|"draft"|"active"|"closed", search, sortBy, sortDir }
 * @returns Promise - data is { content, totalElements, totalPages, number, size }
 */
export const searchAdminJobs = (collegeId, params = {}, config) => {
  if (!collegeId) return Promise.reject(new Error("collegeId is required"));
  const { page = 0, size = 20, status, search, sortBy, sortDir } = params;
  const sp = new URLSearchParams({ collegeId, page, size });
  if (status) sp.set("status", status);
  if (search) sp.set("search", search);
  if (sortBy) sp.set("sortBy", sortBy);
  if (sortDir) sp.set("sortDir", sortDir);
  return Api.get(`/api/v1/admin/jobs/search?${sp.toString()}`, config);
};

/** Bulk open/close up to 100 drives at once. */
export const bulkUpdateAdminJobStatus = (collegeId, jobIds, isActive) => {
  if (!collegeId || !Array.isArray(jobIds) || jobIds.length === 0) {
    return Promise.reject(new Error("collegeId and jobIds are required"));
  }
  return Api.post(`/api/v1/admin/jobs/bulk-status?collegeId=${collegeId}`, { jobIds, isActive });
};

/**
 * Get applications for a job with pagination and status filter.
 * @param {number} jobId
 * @param {number} collegeId
 * @param {Object} params - { page, size, applicationStatus, source, departmentId, programId, batchId, search }
 * @param {Object} config - axios config (signal, etc.)
 * @returns Promise - data is { content, totalElements, totalPages, number, size, statusUpdatedByNames }
 */
export const getAdminJobApplications = (jobId, collegeId, params = {}, config) => {
  if (!jobId || !collegeId) return Promise.reject(new Error("jobId and collegeId are required"));
  const { page = 0, size = 20, applicationStatus, source, departmentId, programId, batchId, search } = params;
  const sp = new URLSearchParams({ collegeId, page, size });
  if (applicationStatus) sp.set("applicationStatus", applicationStatus);
  if (source) sp.set("source", source);
  if (departmentId != null) sp.set("departmentId", departmentId);
  if (programId != null) sp.set("programId", programId);
  if (batchId != null) sp.set("batchId", batchId);
  if (search && String(search).trim()) sp.set("search", String(search).trim());
  return Api.get(`/api/v1/admin/jobs/${jobId}/applications?${sp.toString()}`, config);
};

// P3 in the audit -- ApplicationScreening detail + rescreenApplication existed server-side with
// no controller endpoint at all (not just no UI caller).
export const getAdminApplicationScreening = (applicationId, collegeId) =>
  Api.get(`/api/v1/admin/jobs/applications/${applicationId}/screening?collegeId=${collegeId}`);

export const rescreenAdminApplication = (applicationId, collegeId) =>
  Api.post(`/api/v1/admin/jobs/applications/${applicationId}/rescreen?collegeId=${collegeId}`);

export const getAdminJobApplication = (jobId, applicationId, collegeId, config) => {
  if (!jobId || !applicationId || !collegeId) {
    return Promise.reject(new Error("jobId, applicationId, and collegeId are required"));
  }
  return Api.get(`/api/v1/admin/jobs/${jobId}/applications/${applicationId}?collegeId=${collegeId}`, config);
};

export const bulkUpdateAdminApplicationStatus = (jobId, collegeId, applicationIds, newStatus, assessmentUrl, rejectionReason, saveAssessmentUrlToJob = true) => {
  if (!jobId || !collegeId || !Array.isArray(applicationIds) || applicationIds.length === 0 || !newStatus) {
    return Promise.reject(new Error("jobId, collegeId, applicationIds (non-empty array), and newStatus are required"));
  }
  const body = { applicationIds, newStatus };
  if (assessmentUrl) body.assessmentUrl = assessmentUrl;
  if (newStatus === "ASSESSMENT") body.saveAssessmentUrlToJob = Boolean(saveAssessmentUrlToJob);
  if (rejectionReason != null && String(rejectionReason).trim()) body.rejectionReason = String(rejectionReason).trim();
  return Api.post(`/api/v1/admin/jobs/${jobId}/applications/bulk-status?collegeId=${collegeId}`, body);
};

export const updateAdminApplicationStatus = (jobId, applicationId, applicationStatus, collegeId, assessmentUrl, rejectionReason, saveAssessmentUrlToJob = true) => {
  if (!jobId || !applicationId || !collegeId) {
    return Promise.reject(new Error("jobId, applicationId, and collegeId are required"));
  }
  const body = { applicationStatus };
  if (assessmentUrl) body.assessmentUrl = assessmentUrl;
  if (applicationStatus === "ASSESSMENT") body.saveAssessmentUrlToJob = Boolean(saveAssessmentUrlToJob);
  if (rejectionReason != null && String(rejectionReason).trim()) body.rejectionReason = String(rejectionReason).trim();
  return Api.put(
    `/api/v1/admin/jobs/${jobId}/applications/${applicationId}/status?collegeId=${collegeId}`,
    body
  );
};

export const getAdminApplicationHistory = (jobId, applicationId, collegeId, config) => {
  if (!jobId || !applicationId || !collegeId) {
    return Promise.reject(new Error("jobId, applicationId, and collegeId are required"));
  }
  return Api.get(`/api/v1/admin/jobs/${jobId}/applications/${applicationId}/history?collegeId=${collegeId}`, config);
};

/**
 * Get the resume URL for an application (org-scoped), falling back to the learner's profile
 * resume if the application didn't capture its own. Resume URLs are plain public R2 links (no
 * signing) — this endpoint's value is the org-scope check and the fallback resolution, not URL
 * protection; still prefer it over reading application.resumeUrl directly so that fallback keeps
 * working consistently everywhere this is used.
 */
export const getAdminResumePreviewUrl = (applicationId) => {
  if (!applicationId) return Promise.reject(new Error("applicationId is required"));
  return Api.get(`/api/v1/admin/placement/jobs/applications/${applicationId}/resume-preview`).then((res) => {
    const d = res?.data?.data ?? res?.data;
    return d?.url || null;
  });
};

export const updateAdminApplicationNotes = (jobId, applicationId, collegeId, internalNotes, version) => {
  if (!jobId || !applicationId || !collegeId) {
    return Promise.reject(new Error("jobId, applicationId, and collegeId are required"));
  }
  return Api.patch(
    `/api/v1/admin/jobs/${jobId}/applications/${applicationId}/notes?collegeId=${collegeId}`,
    { internalNotes: internalNotes == null ? null : String(internalNotes).trim() || null, version: version ?? null }
  );
};

export const attachAdminOfferLetter = (jobId, applicationId, collegeId, offerLetterUrl) => {
  if (!jobId || !applicationId || !collegeId) {
    return Promise.reject(new Error("jobId, applicationId, and collegeId are required"));
  }
  return Api.patch(
    `/api/v1/admin/jobs/${jobId}/applications/${applicationId}/offer-letter?collegeId=${collegeId}`,
    { offerLetterUrl }
  );
};

export const exportAdminJobApplicationsCsv = (jobId, collegeId, filters = {}) => {
  if (!jobId || !collegeId) return Promise.reject(new Error("jobId and collegeId are required"));
  const params = new URLSearchParams({ collegeId: String(collegeId) });
  const { applicationStatus, source, departmentId, programId, batchId, search } = filters || {};
  if (applicationStatus) params.set("applicationStatus", applicationStatus);
  if (source) params.set("source", source);
  if (departmentId != null) params.set("departmentId", String(departmentId));
  if (programId != null) params.set("programId", String(programId));
  if (batchId != null) params.set("batchId", String(batchId));
  if (search) params.set("search", search);
  return Api.get(`/api/v1/admin/jobs/${jobId}/applications/export?${params.toString()}`, {
    responseType: "blob",
  });
};

export const getAdminJobDeletionImpact = (jobId, collegeId, config) => {
  if (!jobId || !collegeId) return Promise.reject(new Error("jobId and collegeId are required"));
  return Api.get(`/api/v1/admin/jobs/${jobId}/delete-impact?collegeId=${collegeId}`, config);
};

export const deleteAdminJob = (jobId, collegeId) => {
  if (!jobId || !collegeId) return Promise.reject(new Error("jobId and collegeId are required"));
  return Api.delete(`/api/v1/admin/jobs/${jobId}?collegeId=${collegeId}`);
};

/** Phase 6 - 19.1: Resolve job context (collegeId) for deep links when collegeId is missing in URL */
export const getJobContext = (jobId) =>
  Api.get(`/api/v1/admin/jobs/${jobId}/context`);

/** Phase 5 - Hiring metrics (college-scoped). Params: collegeId (required), jobId, appliedAfter, appliedBefore, departmentId, programId, batchId, classId */
export const getAdminHiringMetrics = (collegeId, params = {}) => {
  if (!collegeId) return Promise.reject(new Error("collegeId is required"));
  const sp = new URLSearchParams({ collegeId });
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "" && k !== "collegeId") sp.set(k, String(v));
  });
  return Api.get(`/api/v1/admin/jobs/metrics?${sp.toString()}`);
};

/** Phase 5 - Hiring funnel (college-scoped). */
export const getAdminHiringFunnel = (collegeId, params = {}) => {
  if (!collegeId) return Promise.reject(new Error("collegeId is required"));
  const sp = new URLSearchParams({ collegeId });
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "" && k !== "collegeId") sp.set(k, String(v));
  });
  return Api.get(`/api/v1/admin/jobs/funnel?${sp.toString()}`);
};

/** Phase 5 - Company-wise hiring report (college-scoped). */
export const getAdminCompanyReport = (collegeId, params = {}) => {
  if (!collegeId) return Promise.reject(new Error("collegeId is required"));
  const sp = new URLSearchParams({ collegeId });
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "" && k !== "collegeId") sp.set(k, String(v));
  });
  return Api.get(`/api/v1/admin/jobs/company-report?${sp.toString()}`);
};

// ============ COMMUNICATION ============

// Notifications
export const createNotification = (data) =>
  Api.post("/api/v1/notification/createNotification", data);

// Named to match its actual endpoint and disambiguate from notificationService.js's own
// getNotifications(queryParams) — same name, different file, unrelated signature/endpoint; kept
// them apart by accident so far, but identical export names across two service files is a
// footgun for a future copy-paste import.
export const getNotificationsByClassId = (classId) =>
  Api.get(`/api/v1/notification/getNotificationsByClassId?classId=${classId}`);

export const updateNotification = (id, data) =>
  Api.put(`/api/v1/notification/update/${id}`, data);

export const deleteNotification = (id) =>
  Api.delete(`/api/v1/notification/delete/${id}`);

// Announcements
export const createAnnouncement = (data) =>
  Api.post("/api/v1/announcements/create", data);

/**
 * Fetch announcements scoped to the caller's own college/org. Uses /fetchAll, which now allows
 * college admins (not just super-admins) and derives the college/org scope from the authenticated
 * principal server-side — no client-supplied collegeId is used for filtering.
 *
 * Previously this called fetchFacultyAnnouncements with facultyId=0/deptId=0 as "match nothing"
 * sentinels, but facultyId=0 collides with the backend's reserved super-admin id, which leaked
 * every super-admin-authored announcement (any college) into this list via the query's
 * `OR a.senderId = :facultyId` branch.
 */
export const getAnnouncementsByCollege = (collegeId, pageNumber = 0, pageSize = 20) =>
  Api.get("/api/v1/announcements/fetchAll", {
    params: { pageNumber, pageSize },
  });

export const updateAnnouncement = (id, data) =>
  Api.put(`/api/v1/announcements/update/${id}`, data);

export const deleteAnnouncement = (id) =>
  Api.delete(`/api/v1/announcements/delete/${id}`);

export const getDeletedAnnouncements = () =>
  Api.get("/api/v1/announcements/deleted");

export const restoreAnnouncement = (id) =>
  Api.post(`/api/v1/announcements/restore/${id}`);

// D3 in the audit -- Course/Lesson/Announcement above each got their own bespoke deleted/restore
// pair; every other soft-deleting entity (department, program, class, semester, lecture hall,
// quiz, notification, college, organization) routes through one generic recycle-bin controller
// instead, returning a uniform {id, name, subtitle} shape. Batch is absent on purpose: its delete
// is a hard delete, so there is no row left to restore.
export const getRecycleBinTypes = () =>
  Api.get("/api/v1/admin/recycle-bin/types");

export const getRecycleBinItems = (entityType, collegeId) =>
  Api.get(`/api/v1/admin/recycle-bin?${buildQuery({ entityType, collegeId })}`);

export const restoreRecycleBinItem = (entityType, id, collegeId) =>
  Api.post(`/api/v1/admin/recycle-bin/restore?${buildQuery({ entityType, id, collegeId })}`);

// ============ UTILITY ============

// File Upload
export const uploadFile = (formData) =>
  Api.post("/api/v1/upload/file/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

/**
 * Upload via backend (server-to-R2). Avoids browser CORS issues with R2 presigned URLs.
 * @param {File} file
 * @param {Object} options - { folder?: string, type?: string, userId?: number, lessonContentId?: number }
 * @returns {Promise<{ publicUrl: string, key: string, originalName: string, size: number, mimetype: string, uploadReceiptId?: string }>}
 */
export const uploadFileViaBackend = (file, options = {}) => {
  const { folder, type = "generic", userId, courseId, classId, lessonContentId, projectId, collegeId } = options;
  const form = new FormData();
  form.append("file", file);
  if (folder) form.append("folder", folder);
  if (type) form.append("type", type);
  if (userId != null) form.append("userId", String(userId));
  if (courseId != null) form.append("courseId", String(courseId));
  if (classId != null) form.append("classId", String(classId));
  if (lessonContentId != null) form.append("lessonContentId", String(lessonContentId));
  if (projectId != null) form.append("projectId", String(projectId));
  if (collegeId != null) form.append("collegeId", String(collegeId));
  return uploadFile(form).then((res) => {
    const d = res?.data?.data ?? res?.data;
    return {
      publicUrl: d?.publicUrl ?? "",
      key: d?.key ?? "",
      originalName: d?.originalName ?? file?.name ?? "upload",
      size: d?.size ?? file?.size ?? 0,
      mimetype: d?.mimetype ?? file?.type ?? "application/octet-stream",
      uploadReceiptId: d?.uploadReceiptId,
    };
  });
};

/**
 * Get presigned PUT URL for direct upload to R2.
 * @param {Object} params - { fileName, contentType, contentLength, folder?, type? }
 * @returns {Promise<{ uploadUrl, key, publicUrl }>}
 */
export const getPresignUpload = (params) =>
  Api.post("/api/v1/upload/presign", params).then((res) => {
    const d = res?.data;
    return {
      uploadUrl: d?.uploadUrl ?? d?.data?.uploadUrl,
      key: d?.key ?? d?.data?.key,
      publicUrl: d?.publicUrl ?? d?.data?.publicUrl,
      uploadReceiptId: d?.uploadReceiptId ?? d?.data?.uploadReceiptId,
    };
  });

/**
 * Validate a video URL before import (lightweight HEAD check: type + size).
 * @param {string} url - Public URL of the video (http/https)
 * @returns {Promise<{ valid: boolean, message: string, contentType?: string, contentLength?: number }>}
 */
export const validateVideoUrl = (url) =>
  Api.post("/api/v1/upload/validate-video-url", { url }).then((res) => {
    const d = res?.data?.data ?? res?.data;
    return {
      valid: d?.valid === true,
      message: d?.message ?? (d?.valid ? "URL is valid." : "Validation failed."),
      contentType: d?.contentType,
      contentLength: d?.contentLength,
    };
  });

/**
 * Import video from URL: backend fetches the URL, uploads to R2, returns key and file info.
 * @param {string} url - Public URL of the video (http/https)
 * @returns {Promise<{ key, originalName, size, mimetype }>}
 */
export const importVideoFromUrl = (url) =>
  Api.post("/api/v1/upload/import-video-from-url", { url }).then((res) => {
    const d = res?.data?.data ?? res?.data;
    return {
      key: d?.key,
      publicUrl: d?.publicUrl,
      originalName: d?.originalName ?? "imported-video.mp4",
      size: d?.size ?? 0,
      mimetype: d?.mimetype ?? "video/mp4",
    };
  });

export const importFileFromUrl = ({ url, folder, type = "generic", userId, courseId, classId, lessonContentId }) =>
  Api.post("/api/v1/upload/import-file-from-url", {
    url,
    folder,
    type,
    ...(userId != null && { userId }),
    ...(courseId != null && { courseId }),
    ...(classId != null && { classId }),
    ...(lessonContentId != null && { lessonContentId }),
  }).then((res) => {
    const d = res?.data?.data ?? res?.data;
    return {
      publicUrl: d?.publicUrl ?? "",
      key: d?.key ?? "",
      originalName: d?.originalName ?? "imported-file",
      size: d?.size ?? 0,
      mimetype: d?.mimetype ?? "application/octet-stream",
      uploadReceiptId: d?.uploadReceiptId,
    };
  });

// Delete file from R2 storage
// fileName should be the key/path in R2 (e.g., "lesson-content/uuid.pdf")
// options: { collegeId? } — required for college-branding keys, where tenant scope can't be
// derived from the caller's own principal (see FileUploadController.deleteFile).
export const deleteFileFromR2 = (fileName, options = {}) => {
  const params = new URLSearchParams({ fileName });
  if (options.collegeId != null) params.set("collegeId", String(options.collegeId));
  return Api.delete(`/api/v1/upload/file/delete?${params.toString()}`);
};

/**
 * Resolve a file URL via backend (enforces tenant + scope access).
 * Use for lesson-content keys to avoid direct R2 CORS/public access issues.
 * @param {string} fileName - R2 key (e.g. org-2/college-2/lesson-content/uuid.pdf)
 * @param {Object} options - { courseId?: number, classId?: number, userId?: number }
 * @returns {Promise<string>} public URL
 */
const buildQueryString = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
};

export const getFileUrl = async (fileName, options = {}) => {
  // Browser-native viewers (iframe/object/new tab) cannot send the in-memory
  // Authorization header, so keep the HttpOnly access cookie warm before use.
  if (typeof window !== "undefined" && Date.now() - lastFileStreamCookieRefreshMs > FILE_STREAM_COOKIE_REFRESH_INTERVAL_MS) {
    lastFileStreamCookieRefreshMs = Date.now();
    try {
      await refreshAccessToken();
    } catch (_) {
      // The stream endpoint will still enforce auth and return 401 if the session is gone.
    }
  }
  // Prefer same-origin streaming URL to avoid R2 CORS issues in browser fetch/pdf renderers.
  const query = buildQueryString({ fileName, ...options });
  return `${API_URL}/api/v1/upload/file/stream${query}`;
};

// Generic fetch wrapper with error handling
export const fetchWithErrorHandling = async (apiCall) => {
  try {
    const response = await apiCall;
    return { success: true, data: response?.data?.data ?? response?.data ?? [] };
  } catch (error) {
    const presentation = getApiErrorPresentation(error);
    // Preserve raw response data for callers that need field-level validation, while exposing
    // normalized safe copy for generic page/error states.
    const errorDetails = {
      kind: presentation.kind,
      userMessage: presentation.message,
      retryable: presentation.retryable,
      success: false,
      message: error?.response?.data?.message || error?.message || "An error occurred",
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      error: error?.response?.data?.error || error?.message,
      // Extract validation errors if present
      validationErrors: error?.response?.data?.errors || error?.response?.data?.validationErrors || null,
      // Full response data for debugging
      responseData: error?.response?.data || null,
    };
    return errorDetails;
  }
};

// 42's announcements to every placement cell (N12).
export const listSuperAdminAnnouncements = () => Api.get("/api/v1/superadmin/announcements");
export const postSuperAdminAnnouncement = (body) => Api.post("/api/v1/superadmin/announcements", body);
export const deleteSuperAdminAnnouncement = (id) => Api.delete(`/api/v1/superadmin/announcements/${id}`);
export const updateSuperAdminAnnouncement = (id, body) => Api.put(`/api/v1/superadmin/announcements/${id}`, body);
export const listPlacementCells = () => Api.get("/api/v1/superadmin/announcements/placement-cells");
