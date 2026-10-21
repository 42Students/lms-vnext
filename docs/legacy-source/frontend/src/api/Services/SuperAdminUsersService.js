import Api from "../ApiMethod";

export const listFacultyAdmins = (params = {}) =>
  Api.get("/api/v1/superadmin/users/faculty-admins", { params });

export const createFacultyAdmin = (data) =>
  Api.post("/api/v1/superadmin/users/faculty-admins", data);

export const setFacultyAdminStatus = (id, data) =>
  Api.put(`/api/v1/superadmin/users/faculty-admins/${id}/status`, data);

export const listUserSessions = (userType, userId) =>
  Api.get(`/api/v1/superadmin/users/${userType}/${userId}/sessions`);

export const revokeAllUserSessions = (userType, userId) =>
  Api.post(`/api/v1/superadmin/users/${userType}/${userId}/sessions/revoke-all`);

