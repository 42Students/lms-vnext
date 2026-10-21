import Api from "../ApiMethod";

// Groups kernel API. Backend: controller/groups/* (docs/groups/GROUPS-KERNEL.md). A group is a
// named set of students for a purpose; features (electives, CRT, transport, ...) reference it by
// id. Admin calls go through /api/v1/admin/groups/** (ROLE_ADMIN, tenant-checked per id);
// learner calls through /api/v1/learner/groups/** and always act as self.
//
// Responses are plain bodies (no {status, data} envelope): read `res.data` directly. Errors come
// back as {error: "..."} with 404 (not found / not yours), 400 (rejected input) or 409 (state
// conflict, full, duplicate) — see errorMessage().

const ADMIN = "/api/v1/admin/groups";
const LEARNER = "/api/v1/learner/groups";

// --- Admin: groups -----------------------------------------------------------------------------
export const listGroups = (params = {}) => Api.get(ADMIN, { params });
export const getGroup = (id) => Api.get(`${ADMIN}/${id}`);
export const createGroup = (body) => Api.post(ADMIN, body);
export const updateGroup = (id, body) => Api.put(`${ADMIN}/${id}`, body);
export const setGroupStatus = (id, to) => Api.post(`${ADMIN}/${id}/status`, null, { params: { to } });
export const deleteGroup = (id) => Api.delete(`${ADMIN}/${id}`);
export const reconcileGroup = (id) => Api.post(`${ADMIN}/${id}/reconcile`);

// --- Admin: members ----------------------------------------------------------------------------
export const getMembers = (id, state) => Api.get(`${ADMIN}/${id}/members`, { params: state ? { state } : {} });
export const addMembers = (id, body) => Api.post(`${ADMIN}/${id}/members`, body);
export const removeMember = (id, learnerId, body) => Api.delete(`${ADMIN}/${id}/members/${learnerId}`, { data: body || {} });
export const lockMember = (id, learnerId, locked) =>
  Api.post(`${ADMIN}/${id}/members/${learnerId}/lock`, null, { params: { locked } });
export const getEvents = (id) => Api.get(`${ADMIN}/${id}/events`);

// --- Admin: rule ---------------------------------------------------------------------------------
export const getRule = (id) => Api.get(`${ADMIN}/${id}/rule`);
export const setRule = (id, body) => Api.put(`${ADMIN}/${id}/rule`, body);
export const clearRule = (id) => Api.delete(`${ADMIN}/${id}/rule`);
export const previewRule = (id) => Api.get(`${ADMIN}/${id}/rule/preview`);
export const applyRule = (id) => Api.post(`${ADMIN}/${id}/rule/apply`);

// --- Learner ----------------------------------------------------------------------------------
export const myGroups = (kind) => Api.get(`${LEARNER}/mine`, { params: kind ? { kind } : {} });
export const openGroups = (kind) => Api.get(`${LEARNER}/open`, { params: kind ? { kind } : {} });
export const getLearnerGroup = (id) => Api.get(`${LEARNER}/${id}`);
export const joinGroup = (id) => Api.post(`${LEARNER}/${id}/join`);
export const leaveGroup = (id) => Api.post(`${LEARNER}/${id}/leave`);

/** The message to show for a failed call, in the order the backend actually populates them. */
export const errorMessage = (error, fallback = "Something went wrong") =>
  error?.response?.data?.error || error?.response?.data?.message || error?.message || fallback;

export const GROUP_STATUSES = ["DRAFT", "ACTIVE", "CLOSED", "ARCHIVED"];
export const MEMBER_STATES = ["ACTIVE", "WAITLISTED", "REQUESTED", "REMOVED"];
/** Suggested kinds. Any upper-case identifier is accepted; the kernel never interprets it. */
export const SUGGESTED_KINDS = ["CRT", "MENTORSHIP", "BUS", "CLUB", "CUSTOM"];

/** Allowed status moves, mirrored from GroupService on the backend. */
export const STATUS_TRANSITIONS = {
  DRAFT: ["ACTIVE", "ARCHIVED"],
  ACTIVE: ["CLOSED", "ARCHIVED"],
  CLOSED: ["ACTIVE", "ARCHIVED"],
  ARCHIVED: [],
};
