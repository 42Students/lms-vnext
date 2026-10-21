import {
  createCourseUrl,
  createClassroomMessageUrl,
  createLessonContentUrl,
  deleteAnnouncementUrl,
  getAllFacultyAssignmentsUrl,
  getAllLearnerAssignmentsUrl,
  getClassNameUrl,
  getCourseNameUrl,
  getCourseUrl,
  getCoursesListUrl,
  getClassroomMessagesUrl,
  toggleClassroomPinUrl,
  getGradingUrl,
  getLessonContentMetricsUrl,
  getLessonContentProgressUrl,
  getLearnerCourseHomeStatsUrl,
  getSubmittedAssignUrl,
  saveContentProgressUrl,
  submitAssignmentUrl,
  viewSubmitAssignmentUrl,
} from "@/api/serviceUrl";
import { createTeachingAssignment } from "./FacultyAssignmentService";
import { getLessonListUrl } from "@/api/serviceUrl";
import { getProgramUrl, getMyProgramDetailsUrl } from "@/api/serviceUrl";
import {
  getFacultyCoursesUrl,
  getCoursesForClassUrl,
  getFileUrl,
  getLessonContentUrl,
  getSpecificLessonContentUrl,
  getLessonUrl,
  getLessonConetntCreateUrl,
} from "@/api/serviceUrl";

import Api from "../ApiMethod";
import { request } from "../ApiMethod";
import axios from "axios";

export async function createCourse(queryParams) {
  return Api.post(createCourseUrl, queryParams)
    .then(res => {
      return res.data;
    })
    .catch(error => {
      // Handle error silently as expected behavior
    });
}

/**
 * Create a faculty course mapping using the new FacultyTeachingAssignment API
 * @param {Object} queryParams - { facultyId, courseId, classId, semesterNumber?, academicYear? }
 * @deprecated Use createTeachingAssignment from FacultyAssignmentService directly
 */
export async function createFacultyCourseMapping(queryParams) {
  // Map old params to new API format
  const newParams = {
    faculty_id: queryParams.facultyId,
    course_id: queryParams.courseId,
    class_id: queryParams.classId,
    semester_number: queryParams.semesterNumber || 1, // Default to semester 1
    academic_year: queryParams.academicYear || new Date().getFullYear() + "-" + (new Date().getFullYear() + 1).toString().slice(-2),
    is_active: true,
  };
  
  return createTeachingAssignment(newParams)
    .then(res => {
      return res.data;
    })
    .catch(error => {
      throw error;
    });
}

export async function getProgram(queryParams) {
  return Api.get(getProgramUrl, { params: queryParams })
    .then(response => {
      return response;
    })
    .catch(error => {
      throw error;
    });
}

/**
 * Get current learner's program details (with program_structure and courses).
 * Use when programId is not available; same response shape as getProgram.
 */
export async function getMyProgramDetails() {
  return Api.get(getMyProgramDetailsUrl)
    .then(response => response)
    .catch(error => {
      throw error;
    });
}

export async function getCoursesList(queryParams) {
  return Api.get(getCoursesListUrl, { params: queryParams })
    .then(response => {
      return response;
    })
    .catch(error => {});
}

export async function getCourseName(queryParams) {
  return Api.get(getCourseNameUrl, { params: queryParams })
    .then(response => {
      return response?.data;
    })
    .catch(error => {});
}

/**
 * Get course name by slug (preferred when slug is available - does not expose course ID)
 * @param {string} slug - The course slug
 * @returns {Promise<{data?: {courseName?: string, course_name?: string, shortTitle?: string}}>}
 */
export async function getCourseNameBySlug(slug) {
  return getCourseBySlug(slug).then(response => {
    const data = response?.data?.data ?? response?.data;
    const name = data?.courseName ?? data?.course_name ?? data?.shortTitle ?? "";
    return { data: name ? { courseName: name, course_name: name } : undefined };
  });
}

// Get LsessonList
export async function getLessonList(queryParams, config = {}) {
  return Api.get(getLessonListUrl, { params: queryParams, ...config })
    .then(res => {
      return res;
    })
    .catch(error => { throw error; });
}

/**
 * Get lesson list by course slug and class (preferred when slug is available)
 * @param {string} courseSlug - Course slug
 * @param {number} classId - Class ID
 */
export async function getLessonListByCourseSlug(courseSlug, classId) {
  return getLessonList({ courseSlug, classId });
}

// Get Specific Lesson content
// export async function getLessonContent(lessonId, classId) {
//   return Api.get(getSpecificLessonContentUrl, { params: { lessonId: lessonId, classId: classId } }).then(res => {
//     return response;
//   }).catch(error => {
//      ;
//   });
// }

/**
 * Get faculty's class/course mappings using new FacultyTeachingAssignment API
 * @param {Object} queryParams - { facultyId: number }
 */
export async function getFacultyProgram(queryParams) {
  const { getActiveAssignmentsByFaculty } = await import("./FacultyAssignmentService");
  
  return getActiveAssignmentsByFaculty(queryParams.facultyId)
    .then(response => {
      // Map to expected format
      const data = response?.data?.data || [];
      return {
        data: {
          data: data.map(item => ({
            id: item.id,
            facultyId: item.faculty_id,
            courseId: item.course_id,
            course_id: item.course_id,
            classId: item.class_id,
            class_id: item.class_id,
            courseName: item.course_name,
            className: item.class_name,
            courseSlug: item.course_slug ?? item.courseSlug,
            course_slug: item.course_slug ?? item.courseSlug,
          }))
        }
      };
    })
    .catch(error => {
      return { data: { data: [] } };
    });
}

export async function getCourse(queryParams, config = {}) {
  return Api.get(getCourseUrl, { params: queryParams, ...config })
    .then(response => {
      return response;
    })
    .catch(error => {
      throw error;
    });
}

/**
 * Get course by slug (public identifier)
 * @param {string} slug - The course slug
 */
export async function getCourseBySlug(slug, config = {}) {
  return Api.get(`/api/v1/courses/by-slug/${encodeURIComponent(slug)}`, config)
    .then(response => {
      return response;
    })
    .catch(error => {
      throw error;
    });
}

/**
 * Get learner course home dashboard stats (progress, grades, next content).
 * Learner only. Use courseSlug (preferred) or courseId.
 * @param {{ courseSlug?: string, courseId?: number, signal?: AbortSignal }} params - optional AbortSignal for cancellation
 * @returns {Promise<{ data?: object }>}
 */
export async function getLearnerCourseHomeStats(params) {
  const { courseSlug, courseId, signal } = params || {};
  const query = courseSlug ? { courseSlug } : { courseId };
  if (!courseSlug && !courseId) {
    return Promise.reject(new Error("courseSlug or courseId required"));
  }
  return Api.get(getLearnerCourseHomeStatsUrl, { params: query, signal })
    .then(res => res?.data?.data ?? res?.data ?? res)
    .catch(err => {
      if (err?.name === "AbortError" || err?.code === "ERR_CANCELED") throw err;
      throw err;
    });
}

export async function getFile(queryParams) {
  return Api
    .post("/api/v1/upload/file/upload", queryParams, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then(response => {
      return response;
    })
    .catch(error => {
      throw error;
    });
}

// BE-0004: a failed request rejects, so callers show "couldn't load" (with Retry) instead of an empty lesson.
export async function getLessonContent(queryParams) {
  return Api.get(getLessonContentUrl, { params: queryParams });
}

/**
 * Get progress for all trackable content (video, youtube) in a lesson. Learner only.
 * @param {number} lessonId - Lesson ID (must be positive integer)
 * @returns {Promise<{data?: {data?: Array}}>}
 */
export async function getLessonContentProgress(lessonId) {
  const id = lessonId != null ? Number(lessonId) : NaN;
  if (!Number.isFinite(id) || id <= 0) {
    return Promise.resolve({ data: { data: [] } });
  }
  // BE-0005: a failed request rejects; callers keep what they knew and say progress couldn't load, never "no progress".
  return Api.get(getLessonContentProgressUrl, { params: { lessonId: id } });
}

/**
 * Save progress for one lesson content (e.g. video position). Learner only.
 * @param {Object} body - { lessonContentId, lastPositionSeconds, durationSeconds, completed? }
 */
export async function saveContentProgress(body) {
  if (body == null || typeof body !== "object") {
    return Promise.reject(new Error("Progress body is required"));
  }
  const lessonContentId = body.lessonContentId != null ? Number(body.lessonContentId) : NaN;
  if (!Number.isFinite(lessonContentId) || lessonContentId <= 0) {
    return Promise.reject(new Error("lessonContentId must be a positive number"));
  }
  const lastPositionSeconds = Math.max(0, Math.min(86400 * 24, Math.round(Number(body.lastPositionSeconds) || 0)));
  const durationSeconds = Math.max(0, Math.min(86400 * 24, Math.round(Number(body.durationSeconds) || 0)));
  const payload = {
    lessonContentId,
    lastPositionSeconds,
    durationSeconds,
    completed: typeof body.completed === "boolean" ? body.completed : undefined,
  };
  return Api.put(saveContentProgressUrl, payload)
    .then(res => res)
    .catch(error => {
      throw error;
    });
}

// Create Lesson content
export async function createLessonContent(queryParams) {
  return Api.post(createLessonContentUrl, queryParams)
    .then(res => {
      return res;
    })
    .catch(error => {
      throw error;
    });
}

export async function submitAssignment(queryParams) {
  return Api.post(submitAssignmentUrl, queryParams)
    .then(res => {
      return res;
    })
    .catch(error => {
      throw error;
    });
}

/**
 * Get course details by assignment/mapping ID using new FacultyTeachingAssignment API
 * @param {Object} queryParams - { mappingId: number }
 */
export async function getCourseByMappingId(queryParams) {
  const { getTeachingAssignmentById } = await import("./FacultyAssignmentService");
  
  return getTeachingAssignmentById(queryParams.mappingId)
    .then(res => {
      const data = res?.data?.data;
      if (!data) return null;
      
      // Map new API response to expected format for backwards compatibility
      const courseName = data.course_name ?? data.courseName;
      const courseSlug = data.course_slug ?? data.courseSlug;
      const classId = data.class_id ?? data.classId;
      const className = data.class_name ?? data.className;
      return {
        facultyId: data.faculty_id ?? data.facultyId,
        courseId: data.course_id ?? data.courseId,
        classId,
        className,
        course: {
          id: data.course_id ?? data.courseId,
          slug: courseSlug,
          course_name: courseName,
          courseName,
        },
      };
    })
    .catch(error => {
      return null;
    });
}

export async function getGrading(queryParams) {
  return Api.get(getGradingUrl, { params: queryParams })
    .then(res => {
      return res?.data;
    })
    .catch(error => {
      throw error;
    });
}

/**
 * Get grading by course slug and class (preferred when slug is available)
 * @param {string} courseSlug - Course slug
 * @param {number} classId - Class ID
 */
export async function getGradingByCourseSlug(courseSlug, classId) {
  return getGrading({ courseSlug, classId });
}

// Create Single Module
export async function getLessonCreate(queryParams) {
  return Api.post(getLessonUrl, queryParams)
    .then(response => {
      return response;
    })
    .catch(error => {});
}

export async function getClassroomMessages(queryParams) {
  return Api.get(getClassroomMessagesUrl, { params: queryParams })
    .then(res => res?.data)
    .catch(error => {
      throw error;
    });
}

export async function createClassroomMessage(queryParams) {
  return Api.post(createClassroomMessageUrl, queryParams)
    .then(res => res?.data)
    .catch(error => {
      throw error;
    });
}

export async function toggleClassroomPin(queryParams) {
  const { messageId } = queryParams || {};
  return Api.patch(`${toggleClassroomPinUrl}/${messageId}/pin`, null)
    .then(res => res?.data)
    .catch(error => {
      throw error;
    });
}

export async function deleteClassroomMessage(messageId) {
  return Api.delete(`${toggleClassroomPinUrl}/${messageId}`)
    .then(res => res?.data)
    .catch(error => {
      throw error;
    });
}

export async function deleteAnnouncement(queryParams) {
  return Api.delete(deleteAnnouncementUrl, { params: queryParams }).then(
    response => response?.data
  );
}

// Course-filter dropdown sources for the All Quizzes / All Assignments pages.
// Both return [{slug, courseName}] — slug is the filter value (courseId stays server-internal).
export async function getFacultyCoursesForFilter(facultyId) {
  return Api.get(getFacultyCoursesUrl, { params: { facultyId } })
    .then(res => (Array.isArray(res?.data) ? res.data : res?.data?.data ?? []))
    .catch(() => []);
}

// Errors propagate (LRN-A-05): returning [] on failure made the course filter silently vanish.
export async function getLearnerCoursesForFilter(learnerId) {
  return Api.get(getCoursesForClassUrl, { params: { learnerId } })
    .then(res => {
      const data = res?.data?.data ?? res?.data ?? [];
      return Array.isArray(data) ? data : [];
    });
}

export async function getAllAssignments(queryParams, isTeacher) {
  const allAssignmentsUrl = isTeacher
    ? getAllFacultyAssignmentsUrl
    : getAllLearnerAssignmentsUrl;
  // Errors propagate (LRN-A-02): swallowing them resolved with nothing, which every caller read as
  // "no assignments".
  return Api.get(allAssignmentsUrl, { params: queryParams })
    .then(res => {
      return res?.data;
    });
}

// Faculty audit F-049/F-052: the server returns at most 100 submissions per page (and 50 without paging), so a
// grader or a report that must see every learner follows totalPages. Resolves to { data: [...all rows] }.
const SUBMISSION_PAGE_SIZE = 100;
const MAX_SUBMISSION_PAGES = 100;
async function getAllAssignmentSubmissionPages(params, signal) {
  const rows = [];
  for (let page = 0; page < MAX_SUBMISSION_PAGES; page++) {
    const response = await Api.get(viewSubmitAssignmentUrl, {
      params: { ...params, page, size: SUBMISSION_PAGE_SIZE },
      ...(signal ? { signal } : {}),
    });
    const body = response?.data;
    const pageData = body?.data ?? body;
    const content = Array.isArray(pageData?.content) ? pageData.content : Array.isArray(pageData) ? pageData : [];
    rows.push(...content);
    const totalPages = Number(pageData?.totalPages);
    if (!Array.isArray(pageData?.content) || content.length === 0 || !Number.isFinite(totalPages) || page + 1 >= totalPages) {
      return { data: rows };
    }
  }
  throw new Error("Too many submission pages to load");
}

export async function getAssignmentSubmissions(queryParams) {
  const { signal, all, ...params } = queryParams || {};
  if (all) return getAllAssignmentSubmissionPages(params, signal);
  return Api.get(viewSubmitAssignmentUrl, { params, ...(signal ? { signal } : {}) })
    .then(response => {
      return response?.data;
    })
    .catch(error => {
      throw error;
    });
}

export async function getSubmittedAssign(queryParams) {
  // Errors propagate (LRN-A-03): a failed lookup used to look like "nothing submitted", re-enabling
  // Submit on work that was already handed in.
  return Api.get(getSubmittedAssignUrl, { params: queryParams })
    .then(response => {
      return response?.data;
    });
}

export async function getLessonContentMetrics(queryParams) {
  return Api.get(getLessonContentMetricsUrl, { params: queryParams })
    .then(response => {
      return response?.data;
    })
    .catch(error => {});
}

export async function getClassName(queryParams) {
  return Api.get(getClassNameUrl, { params: queryParams })
    .then(response => {
      return response?.data;
    })
    .catch(error => {});
}

/**
 * Get class names for a course by slug (preferred when slug is available)
 * @param {string} courseSlug - Course slug
 */
export async function getClassNameByCourseSlug(courseSlug) {
  return getClassName({ courseSlug });
}
