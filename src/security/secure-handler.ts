import { randomUUID } from "node:crypto";
import { isSameOriginRequest } from "@/auth/origin";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { requirePermission, type PlatformPermission } from "@/modules/permissions/policy";
import { currentTenantScope, offerRequestValue, runWithTenantHolder } from "@/db/tenant-context";
import { writeStructuredLog } from "@/observability/logger";
import { createSecured } from "@/security/secure-handler-core";

/** Wrap any existing route handler without touching its body. New routes should use `route()` instead. */
export const secured = createSecured({
  isSameOrigin: isSameOriginRequest,
  runWithHolder: runWithTenantHolder,
  currentActor: () => {
    const scope = currentTenantScope();
    return scope ? { userId: scope.userId, collegeId: scope.collegeId, role: scope.role } : null;
  },
  onAudit: (event) => {
    const { actor, ...rest } = event;
    writeStructuredLog(event.status >= 400 ? "WARNING" : "INFO", "api.audit", {
      ...rest,
      userId: actor?.userId ?? null,
      collegeId: actor?.collegeId ?? null,
      role: actor?.role ?? null,
    });
  },
  newRequestId: () => randomUUID(),
  getContext: () => getCurrentRequestContext(),
  requirePermission: (context, permission) => requirePermission(context, permission as PlatformPermission),
  onPermitted: (context) => offerRequestValue("request-context", context),
  onError: (error) => apiErrorResponse(error),
});
