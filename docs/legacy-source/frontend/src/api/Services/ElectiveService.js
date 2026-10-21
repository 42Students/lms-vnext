import Api from "../ApiMethod";

// Electives admin API. Backend: controller/electives/ElectiveAdminController (docs/groups/ELECTIVES.md).
// Every call is scoped to the caller's college (college admin, or a super admin with a college
// selected) and to the `electives` module flag. Bodies and responses are plain camelCase JSON;
// errors are {error} with 404 / 400 / 409 like the groups API.

const BASE = "/api/v1/electives/admin";

// --- Slots -------------------------------------------------------------------------------------
export const listSlots = (params = {}) => Api.get(`${BASE}/slots`, { params });
export const getSlot = (slotId) => Api.get(`${BASE}/slots/${slotId}`);
export const createSlot = (body) => Api.post(`${BASE}/slots`, body);
export const updateSlot = (slotId, body) => Api.put(`${BASE}/slots/${slotId}`, body);
export const archiveSlot = (slotId) => Api.post(`${BASE}/slots/${slotId}/archive`);
export const getUnallocated = (slotId) => Api.get(`${BASE}/slots/${slotId}/unallocated`);

// --- Offerings ---------------------------------------------------------------------------------
export const createOffering = (slotId, body) => Api.post(`${BASE}/slots/${slotId}/offerings`, body);
export const getOffering = (offeringId) => Api.get(`${BASE}/offerings/${offeringId}`);
export const updateOffering = (offeringId, body) => Api.put(`${BASE}/offerings/${offeringId}`, body);
export const archiveOffering = (offeringId) => Api.post(`${BASE}/offerings/${offeringId}/archive`);
export const setOfferingFaculty = (offeringId, facultyIds) => Api.put(`${BASE}/offerings/${offeringId}/faculty`, { facultyIds });

// --- Roster ------------------------------------------------------------------------------------
export const getRoster = (offeringId, state) => Api.get(`${BASE}/offerings/${offeringId}/roster`, { params: state ? { state } : {} });
export const allocate = (offeringId, body) => Api.post(`${BASE}/offerings/${offeringId}/allocate`, body);
export const removeFromOffering = (offeringId, learnerId, body) =>
  Api.delete(`${BASE}/offerings/${offeringId}/roster/${learnerId}`, { data: body || {} });
export const moveLearner = (offeringId, learnerId, toOfferingId) =>
  Api.post(`${BASE}/offerings/${offeringId}/roster/${learnerId}/move`, null, { params: { toOfferingId } });

export const errorMessage = (error, fallback = "Something went wrong") =>
  error?.response?.data?.error || error?.response?.data?.message || error?.message || fallback;

/** Lookup rows come from several older endpoints with mixed naming; normalise once here. */
export const personName = (p) => `${p?.firstName ?? p?.first_name ?? ""} ${p?.lastName ?? p?.last_name ?? ""}`.trim() || `#${p?.id}`;
export const courseLabel = (c) => {
  const name = c?.courseName ?? c?.course_name ?? `Course #${c?.id}`;
  const code = c?.metaData?.courseCode ?? c?.meta_data?.course_code ?? c?.shortTitle ?? c?.short_title;
  return code ? `${name} (${code})` : name;
};
