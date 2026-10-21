import Api from "../ApiMethod";

export const searchAuditLogs = (params = {}) =>
  Api.get("/api/v1/superadmin/audit", { params });

