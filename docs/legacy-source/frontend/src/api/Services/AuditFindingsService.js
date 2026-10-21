import Api from "../ApiMethod";

// /tracker/audit-findings (super admins). Findings come from the 42Students/lms-findings repo; see the backend's
// auditfindings package.
const BASE = "/api/v1/superadmin/audit-findings";

export async function listAuditFindings(params = {}, signal) {
  const response = await Api.get(BASE, { params, signal });
  return response.data;
}

export async function getAuditFinding(id, signal) {
  const response = await Api.get(`${BASE}/${encodeURIComponent(id)}`, { signal });
  return response.data;
}

export async function getAuditFindingsSync(signal) {
  const response = await Api.get(`${BASE}/sync`, { signal });
  return response.data;
}

export async function syncAuditFindings() {
  const response = await Api.post(`${BASE}/sync`);
  return response.data;
}

const act = (path) => async (id, body) => {
  const response = await Api.post(`${BASE}/${encodeURIComponent(id)}/${path}`, body);
  return response.data;
};

export const setAuditFindingStatus = act("status");
export const setAuditFindingSeverity = act("severity");
export const setAuditFindingAssignee = act("assignee");
export const commentOnAuditFinding = act("comment");
export const linkAuditFindingCommit = act("commit");
