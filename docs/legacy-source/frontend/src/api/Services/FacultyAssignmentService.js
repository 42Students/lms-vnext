import Api from "../ApiMethod";

// ============ FACULTY TEACHING ASSIGNMENT ============

export const createTeachingAssignment = (data) =>
  Api.post("/api/v1/teaching-assignment/create", data);

export const createBulkTeachingAssignments = (data) =>
  Api.post("/api/v1/teaching-assignment/createBulk", data);

export const updateTeachingAssignment = (id, data) =>
  Api.put(`/api/v1/teaching-assignment/update/${id}`, data);

export const deleteTeachingAssignment = (id) =>
  Api.delete(`/api/v1/teaching-assignment/delete/${id}`);

export const deactivateTeachingAssignment = (id) =>
  Api.put(`/api/v1/teaching-assignment/deactivate/${id}`);

// ============ FETCH ASSIGNMENTS ============

export const getTeachingAssignmentById = (id) =>
  Api.get(`/api/v1/teaching-assignment/get/${id}`);

export const getAssignmentsByFaculty = (facultyId) =>
  Api.get(`/api/v1/teaching-assignment/byFaculty/${facultyId}`);

// A deterministic role/tenant 403 cannot be fixed by replaying the same protected GET.
// Preserve the global interceptor's behavior for unrelated endpoints while opting out here.
export const getActiveAssignmentsByFaculty = (facultyId, options) =>
  Api.get(`/api/v1/teaching-assignment/byFaculty/${facultyId}/active`, {
    signal: options?.signal, _retry403: true,
  });

export const getAssignmentsByClass = (classId) =>
  Api.get(`/api/v1/teaching-assignment/byClass/${classId}`);

export const getAssignmentsByClassAndSemester = (classId, semesterNumber) =>
  Api.get(`/api/v1/teaching-assignment/byClass/${classId}/semester/${semesterNumber}`);

export const getAssignmentsByBatch = (batchId) =>
  Api.get(`/api/v1/teaching-assignment/byBatch/${batchId}`);

export const getAllTeachingAssignments = () =>
  Api.get("/api/v1/teaching-assignment/fetchAll");

/**
 * BE-0068: one college's teaching assignments, read from the tenant-scoped paged endpoint (the server filters by college
 * in the query) instead of fetchAll, which loads every college's assignments and filters them in memory. Returns the
 * same shape as an Api.get response ({ data: { data: rows } }) so callers can swap it in.
 */
export const getTeachingAssignmentsForCollege = async (collegeId, { pageSize = 200, maxPages = 50 } = {}) => {
  const rows = [];
  for (let page = 0; page < maxPages; page += 1) {
    const response = await Api.get("/api/v1/teaching-assignment/page", { params: { collegeId, page, size: pageSize } });
    const body = response?.data?.data || {};
    rows.push(...(Array.isArray(body.content) ? body.content : []));
    if (!body.totalPages || page + 1 >= body.totalPages) break;
  }
  return { data: { data: rows } };
};

export const getAllActiveTeachingAssignments = () =>
  Api.get("/api/v1/teaching-assignment/fetchActive");

export const deactivateByBatchSemester = (batchId, semesterNumber) =>
  Api.post(`/api/v1/teaching-assignment/deactivateByBatchSemester?batchId=${batchId}&semesterNumber=${semesterNumber}`);
