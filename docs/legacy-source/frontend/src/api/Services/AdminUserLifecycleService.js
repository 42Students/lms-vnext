import Api from "../ApiMethod";

// Reversible Student/Faculty account suspension — see AdminUserLifecycleController on the
// backend. userType is "LEARNER" or "FACULTY".
export const suspendUser = (userType, userId, reason) =>
  Api.put(`/api/v1/admin/users/${userType}/${userId}/suspend`, reason ? { reason } : {});

export const reactivateUser = (userType, userId) =>
  Api.put(`/api/v1/admin/users/${userType}/${userId}/reactivate`);

// Login-as-user for support debugging — superadmin-only. Both mint a fresh cookie-based session
// server-side (see SuperAdminUserAdminController.impersonate/endImpersonation); the caller should
// reload/refetch the current user afterward so the app picks up the new identity.
export const impersonateUser = (userType, userId) =>
  Api.post(`/api/v1/superadmin/users/${userType}/${userId}/impersonate`);

export const endImpersonation = () =>
  Api.post("/api/v1/superadmin/users/impersonate/end");
