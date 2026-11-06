import "server-only";

import { cookies, headers } from "next/headers";
import {
  MEMBERSHIP_COOKIE_NAME,
  ROLE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  SessionAuthenticationError,
  verifyIdentitySessionCookie,
} from "./session";
import {
  E2E_IDENTITY_COOKIE_NAME,
  E2E_SECRET_COOKIE_NAME,
  resolveE2eIdentityUid,
} from "./e2e-identity";
import { resolveRequestContext } from "@/modules/identity/context-service";
import { MEMBERSHIP_ROLES, type MembershipRole } from "@/modules/identity/constants";
import { bindTenantScope, ensureTenantHolder, runAsSystem, scopeFromActor, takeRequestValue } from "@/db/tenant-context";
import { resolveRequestTenant } from "@/modules/auth/request-tenant";
import { isTenantAccessAllowed } from "@/modules/auth/tenant-access";
import {
  ADMIN_SCOPE_COOKIE_NAME,
  decodeAdminScopeCookie,
} from "./admin-scope";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

async function resolveIdentityUid(cookieStore: CookieStore) {
  const e2eIdentityUid = resolveE2eIdentityUid({
    nodeEnv: process.env.NODE_ENV,
    appEnv: process.env["APP_ENV"],
    enabled: process.env["E2E_AUTH_ENABLED"],
    configuredSecret: process.env["E2E_AUTH_SECRET"],
    cookieSecret:
      cookieStore.get(E2E_SECRET_COOKIE_NAME)?.value,
    identityUid:
      cookieStore.get(E2E_IDENTITY_COOKIE_NAME)?.value,
  });

  if (e2eIdentityUid) {
    return e2eIdentityUid;
  }

  const sessionCookie =
    cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    throw new SessionAuthenticationError(
      "SESSION_MISSING",
    );
  }

  const identity =
    await verifyIdentitySessionCookie(sessionCookie);
  return identity.uid;
}

/** Verify session, load persisted membership and role selection, then resolve the
 * actual request Host and enforce its college restriction. Cookies select a
 * workspace but cannot grant permissions. Endpoint guards run afterwards. */
async function resolveCurrentRequestContext() {
  const cookieStore = await cookies();
  const identityUid =
    await resolveIdentityUid(cookieStore);
  const activeMembershipId =
    cookieStore.get(MEMBERSHIP_COOKIE_NAME)?.value ?? null;
  const roleCookie = cookieStore.get(ROLE_COOKIE_NAME)?.value;
  const activeRole = (MEMBERSHIP_ROLES as readonly string[]).includes(roleCookie ?? "") ? (roleCookie as MembershipRole) : null;
  const adminScope = decodeAdminScopeCookie(
    cookieStore.get(ADMIN_SCOPE_COOKIE_NAME)?.value,
  );

  const context = await resolveRequestContext({
    identityUid,
    activeMembershipId,
    activeRole,
    adminScope,
  });

  // A live college membership without exactly one selected, still-granted
  // role is not an authenticated workspace. Reject at the common request
  // boundary rather than relying on every older handler to notice roles=[].
  // The session remains valid so /api/auth/memberships can recover the choice.
  if(context.membership && context.membership.roles.length!==1){
    throw new SessionAuthenticationError("SESSION_INVALID");
  }

  // A college host serves only that college, whatever cookies are presented.
  const tenant = await resolveRequestTenant(
    (await headers()).get("host"),
  );
  if (!isTenantAccessAllowed(context, tenant)) {
    throw new SessionAuthenticationError("SESSION_INVALID");
  }

  return context;
}

export function getCurrentRequestContext() {
  // Must run here, synchronously in the caller's context: see ensureTenantHolder.
  ensureTenantHolder();
  // The route wrapper may already have resolved this actor to check its permission: reuse it exactly once.
  const offered = takeRequestValue<Awaited<ReturnType<typeof resolveAndBind>>>("request-context");
  return offered ? Promise.resolve(offered) : resolveAndBind();
}

async function resolveAndBind() {
  // The session, membership and tenant lookups run before any actor exists, so they run under a named system
  // scope; once resolved, the actor's college/role is bound for the rest of the request (row-level security reads it).
  const context = await runAsSystem("auth:resolve-request-context", resolveCurrentRequestContext);
  bindTenantScope(scopeFromActor(context));
  return context;
}

export async function getCurrentIdentityUid() {
  const cookieStore = await cookies();
  return resolveIdentityUid(cookieStore);
}
