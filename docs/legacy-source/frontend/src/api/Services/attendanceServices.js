const { default: Api } = require("../ApiMethod");
const {
  markStudentAttendanceUrl,
  removeStudentAttendanceUrl,
  getStudentsListbyClassidUrl,
  getClassSheduleByDaterangeUrl,
  getStudentAttendanceByDaterangeUrl,
  studentAttendanceListByDaterangeUrl,
  getLearnerAttendanceCoursesUrl,
  getLearnerAttendanceRecordsUrl,
} = require("../serviceUrl");

// Audit 5.1: attendance for a whole class in one request. The per-learner calls below stay for
// single corrections; this is what the "submit attendance" flow uses, where firing one request per
// learner meant sixty round trips and sixty repetitions of the same authorisation lookups.
export async function markBulkAttendance(payload) {
  try {
    const res = await Api.post("/api/v1/attendance/bulk", payload);
    return res.data;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.error("[attendanceServices] markBulkAttendance failed:", error?.response?.data ?? error?.message ?? error);
    throw error;
  }
}

export async function markStudentAbsent(queryParams) {
  try {
    const res = await Api.post(markStudentAttendanceUrl, queryParams);
    return res.data;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.error("[attendanceServices] markStudentAbsent failed:", error?.response?.data ?? error?.message ?? error);
    throw error;
  }
}

export async function removeStudentAbsent(studentId, classScheduleId) {
  try {
    const res = await Api.delete(removeStudentAttendanceUrl, {
      params: { studentId, classScheduleId },
    });
    return res.data;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.error("[attendanceServices] removeStudentAbsent failed:", error?.response?.data ?? error?.message ?? error);
    throw error;
  }
}

export async function getStudentsListbyClassid(queryParams) {
  const res = await Api.get(getStudentsListbyClassidUrl, {
    params: queryParams,
  });
  return res.data;
}

export async function getClassSheduleByDaterange(queryParams) {
  const res = await Api.get(getClassSheduleByDaterangeUrl, {
    params: queryParams,
  });
  return res.data;
}

export async function getStudentAttendanceByDaterange(queryParams) {
  const res = await Api.get(getStudentAttendanceByDaterangeUrl, {
    params: queryParams,
  });
  return res.data;
}

export async function scheduleClass(queryParams) {
  // /api/v1/scheduleClass/create remains admin-only: faculty use an explicitly scoped
  // endpoint that requires an active assignment to the exact course and class.
  const res = await Api.post("/api/v1/faculty/schedules", queryParams);
  return res.data;
}

export async function getStudentAttendanceListByDaterange(queryParams) {
  const res = await Api.get(studentAttendanceListByDaterangeUrl, {
    params: queryParams,
  });
  return res.data;
}

/**
 * Attendance page: courses for dropdown (current learner). Returns list of { id, label, value, ... }.
 */
export async function getLearnerAttendanceCourses() {
  const res = await Api.get(getLearnerAttendanceCoursesUrl);
  const data = res?.data?.data ?? res?.data;
  return Array.isArray(data) ? data : [];
}

/**
 * Attendance page: attendance records for selected course and date range (current learner from JWT).
 * Returns { classes, absentids }.
 */
export async function getLearnerAttendanceRecords({ courseId, startDate, endDate }) {
  const res = await Api.get(getLearnerAttendanceRecordsUrl, {
    params: { courseId, startDate, endDate },
  });
  const data = res?.data?.data ?? res?.data;
  return data ?? { classes: [], absentids: [] };
}

/**
 * Admin attendance oversight: monthly grid data for a class+course, any faculty (not restricted
 * to the current logged-in faculty like the faculty-facing endpoint). Returns { classes, absentees }
 * — same shape TeacherAttendanceView.jsx already renders.
 */
export async function getAdminAttendanceMonthlyGrid({ collegeId, classId, courseId, startDate, endDate }) {
  const res = await Api.get("/api/v1/admin/attendance/monthly", {
    params: { collegeId, classId, courseId, startDate, endDate },
  });
  return res?.data ?? { classes: {}, absentees: [] };
}
