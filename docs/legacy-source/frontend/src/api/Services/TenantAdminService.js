import Api from "../ApiMethod";

// Superadmin tenant controls (web address, sign-in, branding, global settings)

// A college's one web address: <subdomain>.<base domain> (42lms.com; development.42lms.com on dev).
export const getCollegeSubdomain = (collegeId) =>
  Api.get(`/api/v1/superadmin/tenant/colleges/${collegeId}/subdomain`);

export const allotCollegeSubdomain = (collegeId, subdomain) =>
  Api.put(`/api/v1/superadmin/tenant/colleges/${collegeId}/subdomain`, { subdomain });

export const removeCollegeSubdomain = (collegeId) =>
  Api.delete(`/api/v1/superadmin/tenant/colleges/${collegeId}/subdomain`);

export const getCollegeOnboardingReadiness = (collegeId) =>
  Api.get(`/api/v1/superadmin/tenant/onboarding/readiness/${collegeId}`);

export const getCollegeBranding = (collegeId) =>
  Api.get(`/api/v1/superadmin/tenant/branding/${collegeId}`);

export const upsertCollegeBranding = (collegeId, data) =>
  Api.put(`/api/v1/superadmin/tenant/branding/${collegeId}`, data);

export const getGlobalSettings = () =>
  Api.get("/api/v1/superadmin/tenant/settings/global");

export const putGlobalSettings = (data) =>
  Api.put("/api/v1/superadmin/tenant/settings/global", data);

// Unsets a global setting so the backend falls back to its built-in default. Writing an empty
// string is NOT equivalent: getString returns Optional.of("") for an empty row, so .orElse(default)
// never fires and a string setting like sms.senderId genuinely becomes empty.
export const deleteGlobalSetting = (key) =>
  Api.delete(`/api/v1/superadmin/tenant/settings/global/${encodeURIComponent(key)}`);

export const getOrgSettings = (orgId) =>
  Api.get(`/api/v1/superadmin/tenant/settings/org/${orgId}`);

export const putOrgSettings = (orgId, data) =>
  Api.put(`/api/v1/superadmin/tenant/settings/org/${orgId}`, data);

export const deleteOrgSetting = (orgId, key) =>
  Api.delete(`/api/v1/superadmin/tenant/settings/org/${orgId}/${encodeURIComponent(key)}`);

export const getCollegeSettings = (collegeId) =>
  Api.get(`/api/v1/superadmin/tenant/settings/college/${collegeId}`);

export const putCollegeSettings = (collegeId, data) =>
  Api.put(`/api/v1/superadmin/tenant/settings/college/${collegeId}`, data);

export const deleteCollegeSetting = (collegeId, key) =>
  Api.delete(`/api/v1/superadmin/tenant/settings/college/${collegeId}/${encodeURIComponent(key)}`);
