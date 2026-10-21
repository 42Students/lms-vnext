import Api from "../ApiMethod";

// ============ SEMESTER MANAGEMENT ============

export const createSemester = (data) =>
  Api.post("/api/v1/semester/create", data);

export const updateSemester = (id, data) =>
  Api.put(`/api/v1/semester/update/${id}`, data);

export const deleteSemester = (id) =>
  Api.delete(`/api/v1/semester/delete/${id}`);

export const getSemesterById = (id) =>
  Api.get(`/api/v1/semester/fetch/${id}`);

export const getSemestersByProgram = (programId) =>
  Api.get(`/api/v1/semester/fetchByProgram?programId=${programId}`);

export const getAllSemesters = () =>
  Api.get("/api/v1/semester/fetchAll");

// ============ SEMESTER-COURSE MAPPING ============

export const addCourseToSemester = (semesterId, data) =>
  Api.post(`/api/v1/semester/${semesterId}/courses`, data);

export const addCoursesToSemester = (semesterId, courseIds) =>
  Api.post(`/api/v1/semester/${semesterId}/courses/bulk`, { course_ids: courseIds });

export const removeCourseFromSemester = (semesterId, courseId) =>
  Api.delete(`/api/v1/semester/${semesterId}/courses/${courseId}`);

export const getCoursesInSemester = (semesterId) =>
  Api.get(`/api/v1/semester/${semesterId}/courses`);

/**
 * Curriculum (semester mapping) and staffing (teaching assignments) are separate admin steps.
 * Admin can inspect which mapped courses are missing teaching assignments.
 */
export const getSemesterStaffing = (semesterId) =>
  Api.get(`/api/v1/semester/${semesterId}/staffing`);

export const updateSemesterCourse = (id, data) =>
  Api.put(`/api/v1/semester/courses/${id}`, data);

// ============ STUDENT COURSES (NEW SEMESTER-BASED) ============

export const getStudentCoursesBySemester = (studentId, options) => {
  const params = new URLSearchParams();
  if (options?.semesterId != null) {
    params.set("semesterId", options.semesterId);
  }
  const qs = params.toString();
  // 403 on this role-scoped GET is deterministic; do not replay it in ApiMethod.
  return Api.get(`/api/v1/student-courses/byStudent/${studentId}${qs ? `?${qs}` : ""}`, {
    signal: options?.signal, _retry403: true,
  });
};

export const getLearnerSemesters = (studentId, options) =>
  Api.get(`/api/v1/student-courses/byStudent/${studentId}/semesters`, {
    signal: options?.signal, _retry403: true,
  });

export const getClassCoursesBySemester = (classId) =>
  Api.get(`/api/v1/student-courses/byClass/${classId}`);

export const reorderSemesterCourses = (semesterId, mappingIds) =>
  Api.put(`/api/v1/semester/${semesterId}/courses/reorder`, { mappingIds });
