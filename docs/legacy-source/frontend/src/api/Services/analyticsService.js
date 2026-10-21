import Api from "../ApiMethod";
import {
  getAllCoursesUrl,
  getLessonListUrl,
  getAnalyticsAssignmentsUrl,
  getAssignmentSubmissionStatsUrl,
  getAssignmentSubmissionStatsBulkUrl,
  getAssignmentSubmissionsUrl,
} from "../serviceUrl";

/**
 * Fetch all courses for analytics filter dropdowns.
 * Returns an array of { label, value } objects.
 */
export async function getAnalyticsCourses() {
  const res = await Api.get(getAllCoursesUrl);
  const data = res?.data?.data ?? res?.data;
  const list = Array.isArray(data) ? data : [];
  return list.map((c) => ({ label: c.courseName ?? c.name ?? String(c.id), value: c.id }));
}

/**
 * Fetch lessons/modules for a given course (for module filter dropdown).
 * @param {number|string} courseId
 * Returns an array of { label, value } objects.
 */
export async function getAnalyticsModules(courseId) {
  if (!courseId) return [];
  const res = await Api.get(getLessonListUrl, { params: { courseId } });
  const data = res?.data?.data ?? res?.data;
  const list = Array.isArray(data) ? data : [];
  return list.map((l) => ({ label: l.lessonName ?? l.title ?? String(l.id), value: l.id }));
}

/**
 * Fetch all assignments visible to the current faculty/admin user.
 * Optionally filter by courseId and/or moduleId (lessonId).
 * @param {object} params - { courseId?, moduleId? }
 * Returns raw array of assignment lesson-content objects.
 */
export async function getAnalyticsAssignments({ courseId, moduleId } = {}) {
  const params = {};
  if (courseId) params.courseId = courseId;
  if (moduleId) params.moduleId = moduleId;
  const res = await Api.get(getAnalyticsAssignmentsUrl, { params });
  const data = res?.data?.data ?? res?.data;
  return Array.isArray(data) ? data : [];
}


/**
 * Fetch submission stats for a single assignment/quiz lesson content.
 * @param {number} lessonContentId
 * Returns a SubmissionStatsDTO: { totalStudents, submitted, earlySubmissions, lateSubmissions, ... }
 */
export async function getSubmissionStats(lessonContentId) {
  const res = await Api.get(getAssignmentSubmissionStatsUrl, { params: { lessonContentId } });
  return res?.data?.data ?? res?.data ?? null;
}

/**
 * Fetch submission stats for multiple lesson contents in one request.
 * @param {number[]} lessonContentIds
 * Returns a map: { [lessonContentId]: SubmissionStatsDTO }
 */
export async function getSubmissionStatsBulk(lessonContentIds) {
  const ids = Array.isArray(lessonContentIds) ? lessonContentIds.filter((v) => v != null) : [];
  if (!ids.length) return {};
  const res = await Api.get(getAssignmentSubmissionStatsBulkUrl, { params: { lessonContentIds: ids } });
  const data = res?.data?.data ?? res?.data;
  return data && typeof data === "object" ? data : {};
}

/**
 * Fetch individual submissions for a lesson content (assignment or quiz).
 * @param {number} lessonContentId
 * @param {object} pagination - { page?, size? }
 * Returns array of StudentAssignment submissions.
 */
export async function getSubmissions(lessonContentId, { page, size } = {}) {
  const params = { lessonContentId };
  if (page != null) params.page = page;
  if (size != null) params.size = size;
  const res = await Api.get(getAssignmentSubmissionsUrl, { params });
  const data = res?.data?.data ?? res?.data;
  // Paged result: { content, totalElements, totalPages } or flat array
  if (Array.isArray(data)) return data;
  if (data?.content) return data.content;
  return [];
}
