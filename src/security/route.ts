import { randomUUID } from "node:crypto";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { requireRecentDeviceAuthentication } from "@/auth/recent-device-auth";
import { clientIp } from "@/auth/ip-rate-limit";
import { allowRequestShared } from "@/security/shared-store";
import { apiErrorResponse } from "@/lib/api-error";
import { readBoundedJsonBody } from "@/lib/bounded-json-body";
import { requireActorPermission, type PlatformPermission } from "@/modules/permissions/policy";
import { offerRequestValue, runAsSystem, runWithTenantScope, scopeFromActor } from "@/db/tenant-context";
import { writeStructuredLog } from "@/observability/logger";
import { recordSecurityEvent } from "@/security/audit-store";
import { createRoute } from "@/security/route-core";

type Context = Awaited<ReturnType<typeof getCurrentRequestContext>>;

/**
 * The one way to define an API route. See docs/security/central-security-architecture.md.
 * Wires the real actor resolver, origin check, permission policy, bounded body reader and error mapper.
 */
export const route = createRoute<Context, PlatformPermission>({
  getContext: getCurrentRequestContext,
  requirePermission: (context, permission) =>
    requireActorPermission(context as never, permission as PlatformPermission),
  isSameOrigin: isSameOriginRequest,
  readJson: readBoundedJsonBody,
  onError: apiErrorResponse,
  newRequestId: () => randomUUID(),
  requireFreshAuth: async (context, maxAgeSeconds) => {
    await requireRecentDeviceAuthentication((context as { user: { id: string } }).user.id, maxAgeSeconds);
  },
  allowRequest: allowRequestShared,
  actorKey: (context) => (context as { user: { id: string } }).user.id,
  clientAddress: clientIp,
  // Every authenticated state-changing request draws on one generous per-user budget by default (one bucket per user,
  // so the limiter's memory is bounded by active users, not users x endpoints);
  // sensitive routes set a tighter `rateLimit`, bulk tools may set `rateLimit: false` with a reason in review.
  defaultMutationLimit: { limit: 1200, windowMs: 60_000 },
  defaultPublicLimit: { limit: 120, windowMs: 60_000 },
  onAudit: (event) => {
    const actor = event.context as { user?: { id?: string }; membership?: { id?: string; collegeId?: string; roles?: string[] } | null } | null;
    recordSecurityEvent({
      event: event.download === true ? "api.export" : event.status >= 400 ? "api.denied" : "api.mutation",
      outcome: event.status === 429 ? "rate_limited" : event.status === 401 || event.status === 403 ? "denied" : event.status >= 400 ? "error" : "ok",
      requestId: event.requestId,
      userId: actor?.user?.id ?? null,
      membershipId: actor?.membership?.id ?? null,
      collegeId: actor?.membership?.collegeId ?? null,
      role: actor?.membership?.roles?.[0] ?? null,
      method: event.method,
      path: event.path,
      status: event.status,
      detail: { durationMs: event.durationMs },
    });
    writeStructuredLog(event.status >= 400 ? "WARNING" : "INFO", "api.audit", {
      requestId: event.requestId,
      method: event.method,
      path: event.path,
      status: event.status,
      durationMs: event.durationMs,
      download: event.download === true,
      userId: actor?.user?.id ?? null,
      membershipId: actor?.membership?.id ?? null,
      collegeId: actor?.membership?.collegeId ?? null,
      role: actor?.membership?.roles?.[0] ?? null,
    });
  },
  runInPublicScope: runAsSystem,
  // A handler (or the service it calls) that still resolves its own actor reuses the one resolved here, once, instead of repeating the session lookup.
  runInScope: (context, fn) =>
    runWithTenantScope(scopeFromActor(context as never), () => {
      offerRequestValue("request-context", context);
      return fn();
    }),
});
