import { randomUUID } from "node:crypto";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readBoundedJsonBody } from "@/lib/bounded-json-body";
import { requirePermission, type PlatformPermission } from "@/modules/permissions/policy";
import { runWithTenantScope, scopeFromActor } from "@/db/tenant-context";
import { createRoute } from "@/security/route-core";

type Context = Awaited<ReturnType<typeof getCurrentRequestContext>>;

/**
 * The one way to define an API route. See docs/security/central-security-architecture.md.
 * Wires the real actor resolver, origin check, permission policy, bounded body reader and error mapper.
 */
export const route = createRoute<Context, PlatformPermission>({
  getContext: getCurrentRequestContext,
  requirePermission: (context, permission) =>
    requirePermission(context as never, permission as PlatformPermission),
  isSameOrigin: isSameOriginRequest,
  readJson: readBoundedJsonBody,
  onError: apiErrorResponse,
  newRequestId: () => randomUUID(),
  runInScope: (context, fn) => runWithTenantScope(scopeFromActor(context as never), fn),
});
