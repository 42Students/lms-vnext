import Api from "@/api/ApiMethod";
import {
  createDepartmentCourseUrl,
  updateDepartmentCourseUrl,
  createDepartmentfacultyUrl,
  updateDepartmentFacultyUrl,
  createDepartmentProgramUrl,
  updateDepartmentProgramUrl,
  createDepartmentUrl,
  updateDepartmentUrl,
  getAdminStudentsListUrl,
  getClassesForCourseSyllabusUrl,
  getDepartmentCoursesUrl,
  getDepartmentfacultyListUrl,
  getDepartmentListUrl,
  getDepartmentProgramListUrl,
  getGenericCourseContentUrl,
} from "@/api/serviceUrl";

export async function getDepartmentList(queryParams) {
  return Api.get(getDepartmentListUrl, { params: queryParams })
    .then(response => {
      return response;
    })
    .catch(error => {});
}

export async function getDepartmentCourses(queryParams) {
  return Api.get(getDepartmentCoursesUrl, { params: queryParams })
    .then(response => {
      return response;
    })
    .catch(error => {});
}

export async function getDepartmentProgramList(queryParams) {
  return Api.get(getDepartmentProgramListUrl, { params: queryParams })
    .then(response => {
      return response;
    })
    .catch(error => {});
}

export async function getDepartmentFacultyList(queryParams) {
  return Api.get(getDepartmentfacultyListUrl, { params: queryParams })
    .then(response => {
      return response;
    })
    .catch(error => {});
}

export async function createDepartmentCourse(queryParams) {
  return Api.post(createDepartmentCourseUrl, queryParams)
    .then(response => {
      return response;
    })
    .catch(error => {});
}

export async function updateDepartmentCourse(courseId, queryParams) {
  return Api.put(`${updateDepartmentCourseUrl}/${courseId}`, queryParams)
    .then(response => {
      return response;
    })
    .catch(error => { throw error; });
}

export async function createDepartmentProgram(queryParams) {
  return Api.post(createDepartmentProgramUrl, queryParams)
    .then(response => {
      return response;
    })
    .catch(error => { throw error; });
}

export async function updateDepartmentProgram(programId, queryParams) {
  return Api.put(`${updateDepartmentProgramUrl}/${programId}`, queryParams)
    .then(response => {
      return response;
    })
    .catch(error => { throw error; });
}

export async function createDepartmentFaculty(queryParams) {
  return Api.post(createDepartmentfacultyUrl, queryParams)
    .then(response => {
      return response;
    })
    .catch(error => { throw error; });
}

export async function updateDepartmentFaculty(facultyId, queryParams) {
  return Api.put(`${updateDepartmentFacultyUrl}/${facultyId}`, queryParams)
    .then(response => {
      return response;
    })
    .catch(error => { throw error; });
}

export async function createDepartment(queryParams) {
  return Api.post(createDepartmentUrl, queryParams)
    .then(response => {
      return response;
    })
    .catch(error => { throw error; });
}

export async function updateDepartment(deptId, queryParams) {
  return Api.put(`${updateDepartmentUrl}/${deptId}`, queryParams)
    .then(response => {
      return response;
    })
    .catch(error => { throw error; });
}

export async function getAdminStudentList(queryParams) {
  return Api.get(getAdminStudentsListUrl, { params: queryParams })
    .then(response => {
      return response;
    })
    .catch(error => {});
}

export async function getGenericCourseContent(queryParams) {
  return Api.get(getGenericCourseContentUrl, { params: queryParams })
    .then(response => {
      return response;
    })
    .catch(error => { throw error; });
}

/**
 * Get generic course content by slug (preferred when slug is available - does not expose course ID)
 * @param {string} courseSlug - Course slug
 */
export async function getGenericCourseContentBySlug(courseSlug) {
  return getGenericCourseContent({ courseSlug });
}

/**
 * Get the server-authoritative current audience for a course.
 *
 * A returned class is currently targetable through the active batch semester curriculum,
 * an active teaching override, or a live elective-backed class. Editors may also request
 * historical scope labels for already-stored content; those historical classes are not valid
 * new targets.
 * Returns a Map-like object { [classId]: className }.
 * @param {{ courseSlug?: string, courseId?: number, includeHistoricalClassId?: number, includeHistorical?: boolean }} queryParams
 */
export async function getClassesForCourseSyllabus(queryParams) {
  return Api.get(getClassesForCourseSyllabusUrl, { params: queryParams })
    .then(res => res?.data ?? res)
    .catch(() => ({}));
}

/**
 * Get specific course content (generic + class-specific) for a class. Requires class access.
 * @param {{ courseSlug?: string, courseId?: number, classId: number }} queryParams
 */
export async function getSpecificCourseContent(queryParams) {
  return Api.get("api/v1/lesson/fetchSpecificCourseContents", { params: queryParams })
    .then(res => res)
    .catch(err => {
      throw err;
    });
}
