import { randomUUID } from "node:crypto";
import { isSameOriginRequest } from "@/auth/origin";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { requireRecentDeviceAuthentication } from "@/auth/recent-device-auth";
import { requireActorPermission, type PlatformPermission } from "@/modules/permissions/policy";
import { currentTenantScope, offerRequestValue, runWithTenantHolder } from "@/db/tenant-context";
import { writeStructuredLog } from "@/observability/logger";
import { createHash } from "node:crypto";
import { clientIp } from "@/auth/ip-rate-limit";
import { allowWriteBudget } from "@/security/shared-store";
import { createSecured } from "@/security/secure-handler-core";

import { env } from "@/config/env";
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
  requirePermission: (context, permission) => requireActorPermission(context, permission as PlatformPermission),
  requireFreshAuth: async (context, maxAgeSeconds) => {
    await requireRecentDeviceAuthentication((context as { user: { id: string } }).user.id, maxAgeSeconds);
  },
  onPermitted: (context) => offerRequestValue("request-context", context),
  onError: (error) => apiErrorResponse(error),
  // Every state-changing request draws on one generous budget per caller (address + session), without resolving the
  // session, so no handler's own order changes. SECURITY_SHIM_RATE_LIMIT=off is the emergency switch.
  allowRequest: env.SECURITY_SHIM_RATE_LIMIT === "off" ? undefined : allowWriteBudget,
  // Two budgets: a coarse one per address (sized for a campus behind one NAT; it also caps how many cookie-rotated
  // buckets one host can create) and a finer one per address + session cookie. The cookie value is never trusted as
  // identity, only used to separate people sharing an address.
  rateBuckets: (request) => {
    const ip = clientIp(request);
    // No address and no cookie (machine callers, malformed forwarding): nothing to key on, so no shared bucket.
    if (ip === "unknown" && !request.headers.get("cookie")) return [];
    const out: Array<{ key: string; limit: number }> = [];
    if (ip !== "unknown") out.push({ key: "ip:" + ip, limit: 3000 });
    const cookie = request.headers.get("cookie") ?? "";
    const session = cookie ? createHash("sha256").update(cookie).digest("hex").slice(0, 16) : "anon";
    out.push({ key: "ck:" + ip + ":" + session, limit: 600 });
    return out;
  },
});
