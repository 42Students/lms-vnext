import "server-only";

import type { NextResponse } from "next/server";
import {privateAuthJson} from "./private-response";
import { z } from "zod";
import { isSameOriginRequest } from "@/auth/origin";
import { clientIp } from "@/auth/ip-rate-limit";
import { allowRequestShared } from "@/security/shared-store";
import { authAuditTag, safeAuthAuditFields } from "./auth-audit-privacy";
import { logError, writeStructuredLog } from "@/observability/logger";
import { recordSecurityEvent } from "@/security/audit-store";
import { AuthConfigError } from "./config";
import { LoginError, loginErrorMessage } from "./login-service";
import { resolveRequestTenant } from "./request-tenant";
import {readBoundedAuthJson,AuthRequestBodyTooLarge} from "./bounded-json";

/** Keyed, purpose-separated privacy tag; fixed 24-hex width fits the DB cap. */
export function ipTag(ip: string) {
  return authAuditTag("ip", ip);
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
  // Durable trail (SEC-19): outcome and route only; contacts, codes and tokens never reach it (same fields as the log).
  recordSecurityEvent({ event, outcome: /fail|reject|denied|lock/i.test(event) ? "denied" : "ok", path: context.route, ipTag: ipTag(context.ip), detail: safeAuthAuditFields(fields) });
  writeStructuredLog("INFO", event, {
    ...safeAuthAuditFields(fields),
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
      recordSecurityEvent({ event: "auth.login_rejected", outcome: "denied", path: audit.route, ipTag: ipTag(audit.ip), status: error.status, detail: { code: error.code } });
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
        ...(error.retryAfterSeconds ? {headers:{"Retry-After":String(error.retryAfterSeconds)}} : {}),
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
  // Shared across replicas when SECURITY_SHARED_STORE=on (SEC-01-011); falls back to per-process memory otherwise.
  if (!(await allowRequestShared(`${route}:${ip}`, perMinute, 60_000))) {
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
    ip:ip??"unknown",
  };
}
