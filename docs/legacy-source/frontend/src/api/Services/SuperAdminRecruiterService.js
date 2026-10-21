import Api from "../ApiMethod";

// Super-admin management of recruiter (industry) accounts. Backend: SuperAdminRecruiterController.

export const listRecruiterAccounts = (params = {}) => Api.get("/api/v1/superadmin/recruiters", { params });

export const getRecruiterAccount = (id) => Api.get(`/api/v1/superadmin/recruiters/${id}`);

export const listIndustryCompanies = () => Api.get("/api/v1/superadmin/recruiters/companies");

/** data: { firstName, lastName, contactMobile, contactMail, designation, companyName, collegeIds } */
export const createRecruiterAccount = (data) => Api.post("/api/v1/superadmin/recruiters", data);

export const updateRecruiterAccount = (id, data) => Api.put(`/api/v1/superadmin/recruiters/${id}`, data);

export const suspendRecruiterAccount = (id, reason) => Api.post(`/api/v1/superadmin/recruiters/${id}/suspend`, { reason });

export const reactivateRecruiterAccount = (id) => Api.post(`/api/v1/superadmin/recruiters/${id}/reactivate`);

export const revokeRecruiterSessions = (id) => Api.post(`/api/v1/superadmin/recruiters/${id}/revoke-sessions`);

export const deleteRecruiterAccount = (id) => Api.delete(`/api/v1/superadmin/recruiters/${id}`);

/** data: { collegeId, validUntil (ISO local date-time or null), capabilities } */
export const grantRecruiterCollege = (id, data) => Api.post(`/api/v1/superadmin/recruiters/${id}/colleges`, data);

export const revokeRecruiterCollege = (id, collegeId, reason) =>
  Api.delete(`/api/v1/superadmin/recruiters/${id}/colleges/${collegeId}`, { data: { reason } });
