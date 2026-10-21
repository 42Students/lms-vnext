import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { SESSION_COOKIE_NAME, verifyIdentitySessionCookie } from "@/auth/session";
import { apiErrorResponse } from "@/lib/api-error";
import { isSuperAdmin } from "@/modules/identity/context";
import { can } from "@/modules/permissions/policy";
import { seedDevE2eCollegeFixtures } from "@/modules/people/dev-e2e-seed-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function enabled() {
  return process.env.NODE_ENV !== "production" &&
    process.env.APP_ENV === "development" &&
    process.env.APP_E2E_SEED_ENABLED === "true";
}

function seedSecretMatches(provided: string | null) {
  const expected = process.env.APP_E2E_SEED_SECRET;
  if (!expected || expected.length < 32 || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Opt-in local fixture writer. Ordinary identity override cookies alone
 * cannot authorize it: require a genuine, verified first-party session,
 * a global Super Admin without an acting-college scope, same origin, and an
 * independent >=32-character development seed secret.
 */
export async function POST(request: Request) {
  if (!enabled()) {
    return NextResponse.json({
      error: "E2E_SEED_DISABLED",
      message: "E2E seeding is disabled. Set APP_E2E_SEED_ENABLED=true in a development environment.",
    }, { status: 404 });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  if (!seedSecretMatches(request.headers.get("x-e2e-seed-secret"))) {
    return NextResponse.json({ error: "E2E_SEED_NOT_AUTHORIZED" }, { status: 403 });
  }
  try {
    const cookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
    if (!cookie) return NextResponse.json({ error: "E2E_SEED_NOT_AUTHORIZED" }, { status: 403 });
    const signedIdentity = await verifyIdentitySessionCookie(cookie);
    const context = await getCurrentRequestContext();
    if (signedIdentity.uid !== context.user.identityUid ||
        !isSuperAdmin(context) || !can(context, "system-role.manage")) {
      return NextResponse.json({ error: "E2E_SEED_NOT_SUPER_ADMIN" }, { status: 403 });
    }
    const data = await seedDevE2eCollegeFixtures(context);
    return NextResponse.json({ status: "OK", message: "OK", data });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
