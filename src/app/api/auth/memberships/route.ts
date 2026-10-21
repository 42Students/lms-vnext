import {privateAuthJson} from "@/modules/auth/private-response";
import {readBoundedAuthJson,AuthRequestBodyTooLarge} from "@/modules/auth/bounded-json";
import { z } from "zod";
import { isSameOriginRequest } from "@/auth/origin";
import {
  MEMBERSHIP_COOKIE_NAME,
  ROLE_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  SessionAuthenticationError,
} from "@/auth/session";
import { MEMBERSHIP_ROLES } from "@/modules/identity/constants";
import { headers } from "next/headers";
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

export const runtime = "nodejs";

const switchMembershipSchema = z.strictObject({
  membershipId: z.string().uuid(),
  role: z.enum(MEMBERSHIP_ROLES).optional(),
});

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
  if (!isTenantAccessAllowed(context, tenant)) {
    throw new SessionAuthenticationError("SESSION_INVALID");
  }
  return tenant.kind === "college" ? tenant.collegeId : null;
}

export async function GET() {
  try {
    const identityUid = await getCurrentIdentityUid();
    const collegeScope = await hostCollegeScope(identityUid);
    const choices = await listMembershipChoices(identityUid);
    const memberships = collegeScope
      ? choices.filter((choice) => choice.collegeId === collegeScope)
      : choices;

    return privateAuthJson({ memberships });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
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
    if (parsed.data.role && !membership.roles.includes(parsed.data.role)) {
      throw new ContextResolutionError("MEMBERSHIP_NOT_FOUND");
    }

    const response = privateAuthJson({
      ok: true,
      membership,
      sessionTransport:"FIRST_PARTY_COOKIE",
      hostChange:false,
    });

    response.cookies.set(
      MEMBERSHIP_COOKIE_NAME,
      membership.id,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_MAX_AGE_SECONDS,
      },
    );

    // Only a multi-role person needs a remembered workspace; otherwise the default role applies.
    response.cookies.set(ROLE_COOKIE_NAME, parsed.data.role ?? "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: parsed.data.role ? SESSION_MAX_AGE_SECONDS : 0,
    });

    return response;
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) {
    return privateAuthJson(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  const response = privateAuthJson({ ok: true });
  response.cookies.set(MEMBERSHIP_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(ROLE_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
