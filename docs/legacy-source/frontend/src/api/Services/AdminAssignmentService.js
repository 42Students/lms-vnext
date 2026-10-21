import Api from "../ApiMethod";

// Admin/superadmin assignment oversight — college-wide, unlike the faculty-facing
// AssignmentsContent page which only shows a single faculty's own assignments. The grading
// endpoints below (fetchSubmissions/updatePoints/publishGrade) are the exact same ones the
// faculty grading UI (viewSubmissionsModal.jsx) already uses — they already accept an
// ADMIN-typed faculty principal server-side, so no new backend grading path was needed, only the
// missing "list assignments across the college" endpoint (AdminAssignmentController).

export const listAdminAssignments = (collegeId, courseId, classId, page, size) => {
  const params = new URLSearchParams();
  params.set("collegeId", collegeId);
  if (courseId != null) params.set("courseId", courseId);
  if (classId != null) params.set("classId", classId);
  if (page != null) params.set("page", page);
  if (size != null) params.set("size", size);
  return Api.get(`/api/v1/admin/assignments?${params.toString()}`);
};

export const getAssignmentSubmissions = (lessonContentId, page, size) =>
  Api.get("/api/v1/assignment/fetchSubmissions", {
    params: {
      lessonContentId,
      ...(page != null && size != null ? { page, size } : {}),
    },
  });

export const updateAssignmentPoints = (studentAssignmentId, pointsObtained) =>
  Api.patch("/api/v1/assignment/updatePoints", null, { params: { studentAssignmentId, pointsObtained } });

// Publishes every graded submission for one assignment. Grading is per student by nature; handing
// the results back is not — sixty marked submissions meant sixty publish clicks, with no way to
// tell part-way through how many were left. Quizzes already had the whole-quiz equivalent.
export const publishAllAssignmentGrades = (lessonContentId) =>
  Api.post(`/api/v1/admin/assignments/${lessonContentId}/publish-grades`);

export const publishAssignmentGrade = (studentAssignmentId) =>
  Api.post("/api/v1/assignment/publishGrade", null, { params: { studentAssignmentId } });
