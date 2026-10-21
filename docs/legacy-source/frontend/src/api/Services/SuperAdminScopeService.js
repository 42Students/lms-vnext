import Api from "../ApiMethod";

export const setSuperAdminScope = ({ organizationId = null, collegeId = null } = {}) =>
  Api.post("/api/v1/auth/superadmin/scope", { organizationId, collegeId });

