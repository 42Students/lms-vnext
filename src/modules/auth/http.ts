import "server-only";

import type { NextResponse } from "next/server";
import {privateAuthJson} from "./private-response";
import { z } from "zod";
import { isSameOriginRequest } from "@/auth/origin";
import { allowRequest, clientIp } from "@/auth/ip-rate-limit";
import { createHash } from "node:crypto";
import { logError, writeStructuredLog } from "@/observability/logger";
import { AuthConfigError } from "./config";
import { LoginError, loginErrorMessage } from "./login-service";
import { resolveRequestTenant } from "./request-tenant";
import {readBoundedAuthJson,AuthRequestBodyTooLarge} from "./bounded-json";

/** Short one-way tag so repeated activity can be correlated without storing the address. */
export function ipTag(ip: string) {
  return createHash("sha256").update(ip).digest("hex").slice(0, 12);
}

type AuditContext = { route: string; ip: string };

/** Sign-in audit event. Never carries contacts, codes or tokens. */
export function auditLogin(
  event: string,
  context: AuditContext,
  fields: Record<string, string | number | boolean | null> = {},
) {
  // The caller's event fields may include untrusted labels. Never let them
  // overwrite the security-owned route, component or one-way IP tag.
  writeStructuredLog("INFO", event, {
    ...fields,
    component: "auth-audit",
    route: context.route,
    ipTag: ipTag(context.ip),
  });
}

export function loginErrorResponse(
  error: unknown,
  audit?: AuditContext,
) {
  if (error instanceof LoginError) {
    if (audit) {
      writeStructuredLog("WARNING", "auth.login_rejected", {
        component: "auth-audit",
        route: audit.route,
        ipTag: ipTag(audit.ip),
        code: error.code,
      });
    }
    return privateAuthJson(
      {
        error: error.code,
        message: loginErrorMessage(error.code),
        ...(error.retryAfterSeconds
          ? { retryAfterSeconds: error.retryAfterSeconds }
          : {}),
      },
      {
        status: error.status,
        headers: error.retryAfterSeconds
          ? { "Retry-After": String(error.retryAfterSeconds) }
          : undefined,
      },
    );
  }

  if (error instanceof AuthConfigError) {
    logError("auth.not_configured", error);
    return privateAuthJson(
      { error: "AUTH_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  logError("auth.unexpected_error", error);
  return privateAuthJson({ error: "INTERNAL_ERROR" }, { status: 500 });
}

type Guarded<T> =
  | { ok: true; body: T; tenantCollegeId: string | null; ip: string }
  | { ok: false; response: NextResponse };

/**
 * Same-origin check, per-IP throttle, JSON validation and tenant resolution
 * shared by every unauthenticated login endpoint.
 */
export async function guardLoginRequest<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
  route: string,
  perMinute: number,
): Promise<Guarded<z.infer<T>>> {
  if (!isSameOriginRequest(request)) {
    return {
      ok: false,
      response: privateAuthJson(
        { error: "INVALID_ORIGIN" },
        { status: 403 },
      ),
    };
  }

  const ip = clientIp(request);
  if (!allowRequest(`${route}:${ip}`, perMinute)) {
    return {
      ok: false,
      response: privateAuthJson(
        { error: "TOO_MANY_REQUESTS", retryAfterSeconds: 60 },
        { status: 429, headers: { "Retry-After": "60" } },
      ),
    };
  }

  let json: unknown;
  try {
    json = await readBoundedAuthJson(request);
  } catch(error) {
    const tooLarge=error instanceof AuthRequestBodyTooLarge;
    return {
      ok: false,
      response: privateAuthJson(
        { error: tooLarge?"REQUEST_TOO_LARGE":"INVALID_REQUEST" },
        { status: tooLarge?413:400 },
      ),
    };
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      response: privateAuthJson(
        { error: "INVALID_REQUEST" },
        { status: 400 },
      ),
    };
  }

  const tenant = await resolveRequestTenant(request.headers.get("host"));
  if (tenant.kind === "unknown") {
    return {
      ok: false,
      response: privateAuthJson(
        { error: "UNKNOWN_TENANT_HOST" },
        { status: 404 },
      ),
    };
  }
  if (tenant.kind === "unavailable") {
    // A temporary college-domain lookup outage must never be interpreted
    // as a platform-host login with unrestricted tenant selection.
    return {
      ok: false,
      response: privateAuthJson(
        { error: "TENANT_LOOKUP_UNAVAILABLE" },
        { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "30" } },
      ),
    };
  }

  return {
    ok: true,
    body: parsed.data,
    tenantCollegeId: tenant.kind === "college" ? tenant.collegeId : null,
    ip,
  };
}
