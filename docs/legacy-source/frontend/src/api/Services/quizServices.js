import Api from "../ApiMethod";

export async function listQuizzesV2(queryParams, config = {}) {
  return Api.get("/api/v1/quizzes", { ...config, params: queryParams }).then(res => res?.data);
}

export async function createQuizV2(payload) {
  return Api.post("/api/v1/quizzes", payload).then(res => res?.data);
}

export async function getQuizV2(quizId, queryParams = {}) {
  return Api.get(`/api/v1/quizzes/${quizId}`, { params: queryParams }).then(res => res?.data);
}

export async function updateQuizV2(quizId, payload) {
  return Api.put(`/api/v1/quizzes/${quizId}`, payload).then(res => res?.data);
}

export async function publishQuizV2(quizId) {
  return Api.patch(`/api/v1/quizzes/${quizId}/publish`).then(res => res?.data);
}

// Distinct from publish above: that's whether the quiz itself is available (DRAFT/PUBLISHED).
// These toggle whether learners can see their score/correct-answers on an already-submitted
// attempt -- faculty/admin always see them. Existed with no caller anywhere (Part B "Quizzes:
// release or withhold results").
export async function publishQuizGradesV2(quizId) {
  return Api.patch(`/api/v1/quizzes/${quizId}/publish-grades`).then(res => res?.data);
}

export async function unpublishQuizGradesV2(quizId) {
  return Api.patch(`/api/v1/quizzes/${quizId}/unpublish-grades`).then(res => res?.data);
}

export async function deleteQuizV2(quizId) {
  return Api.delete(`/api/v1/quizzes/${quizId}`).then(res => res?.data);
}

export async function getQuizAttemptV2(quizId) {
  return Api.get(`/api/v1/quizzes/${quizId}/attempt`).then(res => res?.data);
}

export async function submitQuizV2(quizId, payload) {
  return Api.post(`/api/v1/quizzes/${quizId}/submit`, payload).then(res => res?.data);
}

export async function getQuizSubmissionsV2(quizId) {
  return Api.get(`/api/v1/quizzes/${quizId}/submissions`).then(res => res?.data);
}

export async function getMyQuizSubmissionsV2(quizId) {
  return Api.get("/api/v1/quizzes/my-submissions", { params: { quizId } }).then(res => res?.data);
}

/**
 * Admin/superadmin quiz moderation — every quiz across the college regardless of authoring
 * faculty (the plain listQuizzesV2 above always resolves to the calling faculty's own quizzes,
 * which is empty/wrong for an admin principal). Create/edit/delete/publish reuse the same
 * createQuizV2/updateQuizV2/deleteQuizV2/publishQuizV2/getQuizV2/getQuizSubmissionsV2 above —
 * those already work for an admin-typed principal server-side, no admin-specific write path needed.
 */
export async function listAdminQuizzesV2({ collegeId, courseId, page, size }) {
  return Api.get("/api/v1/admin/quizzes", { params: { collegeId, courseId, page, size } }).then(res => res?.data);
}
