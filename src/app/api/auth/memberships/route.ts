import {privateAuthJson} from "@/modules/auth/private-response";
import {readBoundedAuthJson,AuthRequestBodyTooLarge} from "@/lib/request-body";
import { z } from "zod";
import { isSameOriginRequest } from "@/auth/origin";
import {
  MEMBERSHIP_COOKIE_NAME,
  ROLE_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  SessionAuthenticationError,
} from "@/auth/session";
import { MEMBERSHIP_ROLES } from "@/modules/identity/constants";
import { cookies, headers } from "next/headers";
import {
  getCurrentIdentityUid,
} from "@/auth/request-context";
import { resolveRequestTenant } from "@/modules/auth/request-tenant";
import { isTenantAccessAllowed } from "@/modules/auth/tenant-access";
import {
  ContextResolutionError,
  listMembershipChoices,
  resolveRequestContext,
} from "@/modules/identity/context-service";
import { route } from "@/security/route";
import { recordSecurityEvent } from "@/security/audit-store";

import { env } from "@/config/env";
export const runtime = "nodejs";

const switchMembershipSchema = z.strictObject({
  membershipId: z.string().uuid(),
  role: z.enum(MEMBERSHIP_ROLES).optional(),
});

/** Native mobile JWT switch-token was a legacy transport. vNext intentionally
 * supports first-party HttpOnly browser sessions only: no raw bearer or
 * refresh token is returned by list/switch, even to an active membership.
 * Native clients must open the verified college LMS host in a browser session.
 */
export const MEMBERSHIP_SWITCH_TRANSPORT = {
  browser: "FIRST_PARTY_COOKIE",
  nativeTokenPair: "RETIRED",
  nativeNextStep: "OPEN_VERIFIED_LMS_HOST",
} as const;

class MembershipTenantLookupUnavailable extends Error {}
class MembershipHostChangeRequired extends Error {}

function authErrorResponse(error: unknown) {
  if(error instanceof MembershipTenantLookupUnavailable){
    return privateAuthJson({error:"TENANT_LOOKUP_UNAVAILABLE",message:"Service unavailable. Try again from your college LMS address."},{status:503});
  }
  if(error instanceof MembershipHostChangeRequired){
    return privateAuthJson({
      error:"MEMBERSHIP_HOST_CHANGE_REQUIRED",
      message:"Open the selected college's verified LMS address and sign in again. Your session credentials are not transferred between domains.",
      nextStep:"SIGN_IN_ON_TARGET_HOST",
    },{status:409});
  }
  if (error instanceof SessionAuthenticationError) {
    return privateAuthJson(
      { error: error.code, message:"Unauthorized. Sign in again." },
      { status: 401 },
    );
  }

  if (error instanceof ContextResolutionError) {
    return privateAuthJson(
      { error: error.code, message:error.code==="MEMBERSHIP_NOT_ACTIVE"
        ?"This college membership is not active. Contact your administrator."
        :"Invalid membership target. Choose an active college and role." },
      {
        status:
          error.code === "MEMBERSHIP_NOT_FOUND" ||
          error.code === "MEMBERSHIP_NOT_ACTIVE"
            ? 403
            : 401,
      },
    );
  }

  return privateAuthJson(
    { error: "INTERNAL_ERROR" },
    { status: 500 },
  );
}

/**
 * A college host serves only that college: the list and the switch are limited
 * to it, and an unknown host serves nothing (same rule as every other
 * authenticated request).
 */
async function hostCollegeScope(identityUid: string) {
  const tenant = await resolveRequestTenant(
    (await headers()).get("host"),
  );
  if(tenant.kind==="unavailable")throw new MembershipTenantLookupUnavailable();
  const context = await resolveRequestContext({
    identityUid,
    activeMembershipId: null,
  });
  if (isTenantAccessAllowed(context, tenant)) {
    return tenant.kind === "college" ? tenant.collegeId : null;
  }
  // The chooser intentionally has no selected membership. It must still be
  // reachable on the signed-in user's own verified college host, based on a
  // fresh active membership/role lookup rather than a stale selection cookie.
  // This is only host eligibility, never an implicit role selection or grant.
  if (tenant.kind === "college") {
    const choices = await listMembershipChoices(identityUid);
    if (choices.some(choice =>
      choice.collegeId === tenant.collegeId &&
      choice.status === "ACTIVE" &&
      choice.roles.length > 0
    )) {
      return tenant.collegeId;
    }
  }
  throw new SessionAuthenticationError("SESSION_INVALID");
}

async function handleGET() {
  try {
    const identityUid = await getCurrentIdentityUid();
    const collegeScope = await hostCollegeScope(identityUid);
    const choices = await listMembershipChoices(identityUid);
    const memberships = collegeScope
      ? choices.filter((choice) => choice.collegeId === collegeScope)
      : choices;

    const cookieStore=await cookies();
    // Cookies are only *claims* about the user's last selection. Resolve the
    // active choice from this authenticated identity's live, host-filtered list
    // before displaying currentMembershipKey or currentRole. Old targetKey
    // bookmarks never authorize a role or a cross-host session handoff.
    const activeId=cookieStore.get(MEMBERSHIP_COOKIE_NAME)?.value??null;
    const selected=memberships.find(choice=>choice.id===activeId&&choice.status==="ACTIVE")??null;
    const requestedRole=cookieStore.get(ROLE_COOKIE_NAME)?.value??null;
    // A stale explicit cookie must never be displayed as a different,
    // implicitly selected role, even if only one live role remains.
    const currentRole=selected
      ? requestedRole
        ? selected.roles.find(role=>role===requestedRole)??null
        : selected.roles.length===1?selected.roles[0]??null:null
      : null;
    const roleSelectionRequired=Boolean(selected&&selected.roles.length>0&&!currentRole);
    return privateAuthJson({
      memberships:memberships.map(choice=>({...choice,
        label:choice.collegeName+" · "+choice.organizationName,
        selectable:choice.status==="ACTIVE",
        selected:choice.id===selected?.id,
      })),
      currentMembershipKey:selected?.id??null,
      currentMembership:selected,
      currentRole,
      roleSelectionRequired,
      membershipSelectionRequired:!selected||roleSelectionRequired,
      // Domain authority is checked by the server, not a client boolean flag.
      hostNavigation:"FIRST_PARTY_COOKIE",
      nativeSwitchTransport:MEMBERSHIP_SWITCH_TRANSPORT,
      adminScopeEndpoint:"/api/auth/admin-scope",
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
export const GET = route(
  { auth: "public", publicReason: "Sign-in, recovery and session endpoints run before or independently of a session; each handler enforces its own challenge, device or session-state checks.", csrf: false, csrfExemptReason: "The handler applies its own origin and challenge checks, unchanged by this wrapper.", rateLimit: { limit: 3000, windowMs: 60_000 } },
  () => handleGET(),
);

async function handlePOST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return privateAuthJson(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const identityUid = await getCurrentIdentityUid();
    const collegeScope = await hostCollegeScope(identityUid);

    let body: unknown;
    try {
      body = await readBoundedAuthJson(request,2_048);
    } catch(error) {
      const tooLarge=error instanceof AuthRequestBodyTooLarge;
      return privateAuthJson(
        { error: tooLarge?"REQUEST_TOO_LARGE":"INVALID_REQUEST" },
        { status: tooLarge?413:400 },
      );
    }

    const requestedTransport=body!==null&&typeof body==="object"&&!Array.isArray(body)
      ? (body as Record<string,unknown>)["transport"] : null;
    if(requestedTransport==="NATIVE_TOKEN_PAIR"||requestedTransport==="BEARER_TOKEN"||
       requestedTransport==="switch-token"){
      return privateAuthJson({
        error:"NATIVE_SWITCH_TOKEN_RETIRED",
        message:"Native token-pair switching is not supported. Open the selected college's verified LMS host and sign in using the browser session.",
        nextStep:MEMBERSHIP_SWITCH_TRANSPORT.nativeNextStep,
        sessionTransport:MEMBERSHIP_SWITCH_TRANSPORT.browser,
      },{status:410});
    }

    const parsed = switchMembershipSchema.safeParse(body);

    if (!parsed.success) {
      // Legacy targetKey bookmarks cannot prove ownership of an opaque UUID
      // membership and are not accepted as substitute authority.
      const legacyTarget=body!==null&&typeof body==="object"&&!Array.isArray(body)&&
        "targetKey" in body;
      return privateAuthJson({
        error:"INVALID_REQUEST",
        message:legacyTarget
          ?"This old college switch link is no longer supported. Choose an active college and role in the workspace switcher."
          :"Invalid membership target. Choose an active college and role.",
      },{status:400});
    }

    const context = await resolveRequestContext({
      identityUid,
      activeMembershipId: parsed.data.membershipId,
      activeRole: parsed.data.role ?? null,
    });

    const membership = context.membership;
    if (!membership) {
      throw new ContextResolutionError("MEMBERSHIP_NOT_FOUND");
    }
    if (collegeScope && membership.collegeId !== collegeScope) {
      // Verified membership is owned by this user but cannot be activated
      // on the current host. Do not mint raw JWT or URL handoff tokens.
      throw new MembershipHostChangeRequired();
    }
    if(membership.roles.length!==1){
      // Never establish a workspace cookie from a null/stale/forged role when
      // the persisted membership has multiple available roles. Require a new
      // explicit role selection on this same-origin endpoint.
      return privateAuthJson({
        error:parsed.data.role?"ROLE_NOT_GRANTED":"ROLE_SELECTION_REQUIRED",
        message:parsed.data.role
          ?"This role is not currently assigned to your membership."
          :"Choose one role for this college before continuing.",
      },{status:parsed.data.role?403:400});
    }
    if (parsed.data.role && !membership.roles.includes(parsed.data.role)) {
      throw new ContextResolutionError("MEMBERSHIP_NOT_FOUND");
    }

    recordSecurityEvent({ event: "auth.workspace_switched", outcome: "ok", userId: context.user?.id, collegeId: membership.collegeId, path: "/api/auth/memberships", detail: { role: parsed.data.role ?? membership.roles[0] ?? null } });
    const response = privateAuthJson({
      ok: true,
      membership,
      sessionTransport:"FIRST_PARTY_COOKIE",
      hostChange:false,
      selectedRole:parsed.data.role??membership.roles[0]??null,
      next:"/dashboard",
    });

    response.cookies.set(
      MEMBERSHIP_COOKIE_NAME,
      membership.id,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" || env.COOKIE_SECURE === "1",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_MAX_AGE_SECONDS,
      },
    );

    // Only a multi-role person needs a remembered workspace; otherwise the default role applies.
    response.cookies.set(ROLE_COOKIE_NAME, parsed.data.role ?? "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" || env.COOKIE_SECURE === "1",
      sameSite: "lax",
      path: "/",
      maxAge: parsed.data.role ? SESSION_MAX_AGE_SECONDS : 0,
    });

    return response;
  } catch (error) {
    recordSecurityEvent({ event: "auth.workspace_switch_denied", outcome: "denied", path: "/api/auth/memberships", detail: { code: error instanceof ContextResolutionError ? error.code : error instanceof SessionAuthenticationError ? error.code : error instanceof MembershipHostChangeRequired ? "HOST_CHANGE_REQUIRED" : "ERROR" } });
    return authErrorResponse(error);
  }
}
export const POST = route(
  { auth: "public", publicReason: "Sign-in, recovery and session endpoints run before or independently of a session; each handler enforces its own challenge, device or session-state checks.", csrf: false, csrfExemptReason: "The handler applies its own origin and challenge checks, unchanged by this wrapper.", rateLimit: { limit: 60, windowMs: 60_000 } },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);

async function handleDELETE(request: Request) {
  if (!isSameOriginRequest(request)) {
    return privateAuthJson(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  const response = privateAuthJson({ ok: true });
  response.cookies.set(MEMBERSHIP_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || env.COOKIE_SECURE === "1",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(ROLE_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || env.COOKIE_SECURE === "1",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
export const DELETE = route(
  { auth: "public", publicReason: "Sign-in, recovery and session endpoints run before or independently of a session; each handler enforces its own challenge, device or session-state checks.", csrf: false, csrfExemptReason: "The handler applies its own origin and challenge checks, unchanged by this wrapper.", rateLimit: { limit: 3000, windowMs: 60_000 } },
  ({ request }) => handleDELETE(request as Parameters<typeof handleDELETE>[0]),
);
