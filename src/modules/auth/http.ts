import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";
import { isSameOriginRequest } from "@/auth/origin";
import { allowRequest, clientIp } from "@/auth/ip-rate-limit";
import { logError } from "@/observability/logger";
import { AuthConfigError } from "./config";
import { LoginError } from "./login-service";
import { resolveRequestTenant } from "./request-tenant";

export function loginErrorResponse(error: unknown) {
  if (error instanceof LoginError) {
    return NextResponse.json(
      {
        error: error.code,
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
    return NextResponse.json(
      { error: "AUTH_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  logError("auth.unexpected_error", error);
  return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
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
      response: NextResponse.json(
        { error: "INVALID_ORIGIN" },
        { status: 403 },
      ),
    };
  }

  const ip = clientIp(request);
  if (!allowRequest(`${route}:${ip}`, perMinute)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "TOO_MANY_REQUESTS", retryAfterSeconds: 60 },
        { status: 429, headers: { "Retry-After": "60" } },
      ),
    };
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "INVALID_REQUEST" },
        { status: 400 },
      ),
    };
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "INVALID_REQUEST" },
        { status: 400 },
      ),
    };
  }

  const tenant = await resolveRequestTenant(request.headers.get("host"));
  if (tenant.kind === "unknown") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "UNKNOWN_TENANT_HOST" },
        { status: 404 },
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
