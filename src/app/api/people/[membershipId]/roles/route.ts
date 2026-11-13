import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { requireRecentDeviceAuthentication } from "@/auth/recent-device-auth";
import { membershipRoleMutationInputSchema } from "@/modules/people/validation";
import { readBoundedAuthJson, AuthRequestBodyTooLarge } from "@/lib/request-body";
import { requirePermission } from "@/modules/permissions/policy";
import { apiErrorResponse } from "@/lib/api-error";
import { MEMBERSHIP_ROLE_LABELS, type MembershipRole } from "@/modules/identity/constants";
import {
  addMembershipRoleWithRuntime,
  listMembershipRolesWithRuntime,
  removeMembershipRoleWithRuntime,
} from "@/modules/people/runtime";
import { route } from "@/security/route";

import { ROLE } from "@/modules/identity/roles";
import { CACHE } from "@/security/responses";
export const runtime = "nodejs";

/** Presentation labels accompany the stable machine role values. */
function roleLabels(roles: readonly string[]) {
  return roles.map(role => ({
    role, label: MEMBERSHIP_ROLE_LABELS[role as MembershipRole] ?? role,
  }));
}

type RouteContext = {
  params: Promise<{
    membershipId: string;
  }>;
};

async function readJson(request: Request) {
  try {
    return {
      ok: true as const,
      body: await readBoundedAuthJson(request, 2_048),
    };
  } catch (error) {
    const tooLarge=error instanceof AuthRequestBodyTooLarge;
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: tooLarge?"REQUEST_TOO_LARGE":"INVALID_REQUEST" },
        { status: tooLarge?413:400 },
      ),
    };
  }
}

async function handleGET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const context = await getCurrentRequestContext();
    const { membershipId } = await params;
    const roles = await listMembershipRolesWithRuntime(
      context,
      membershipId,
    );

    return NextResponse.json({ roles, roleLabels:roleLabels(roles) }, {
      headers: { "Cache-Control": CACHE.PRIVATE, "Vary": "Cookie" },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);

async function handlePOST(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  const parsedBody = await readJson(request);
  if (!parsedBody.ok) return parsedBody.response;

  try {
    const context = await getCurrentRequestContext();
    const input = membershipRoleMutationInputSchema.parse(parsedBody.body);
    if (input.role === ROLE.COLLEGE_ADMIN || input.role === ROLE.TPO) {
      requirePermission(context, "admin-scope.select");
    }
    // Every role grant/revoke changes authorization, even LEARNER or FACULTY.
    // Reject a stale or E2E-only session before any mutation.
    await requireRecentDeviceAuthentication(context.user.id);
    const { membershipId } = await params;
    const roles = await addMembershipRoleWithRuntime(
      context,
      membershipId,
      parsedBody.body,
    );

    return NextResponse.json({ roles, roleLabels:roleLabels(roles) }, {
      headers: { "Cache-Control": CACHE.PRIVATE, "Vary": "Cookie" },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);

async function handleDELETE(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  const parsedBody = await readJson(request);
  if (!parsedBody.ok) return parsedBody.response;

  try {
    const context = await getCurrentRequestContext();
    const input = membershipRoleMutationInputSchema.parse(parsedBody.body);
    if (input.role === ROLE.COLLEGE_ADMIN || input.role === ROLE.TPO) {
      requirePermission(context, "admin-scope.select");
    }
    // Every role grant/revoke changes authorization, even LEARNER or FACULTY.
    // Reject a stale or E2E-only session before any mutation.
    await requireRecentDeviceAuthentication(context.user.id);
    const { membershipId } = await params;
    const roles = await removeMembershipRoleWithRuntime(
      context,
      membershipId,
      parsedBody.body,
    );

    return NextResponse.json({ roles, roleLabels:roleLabels(roles) }, {
      headers: { "Cache-Control": CACHE.PRIVATE, "Vary": "Cookie" },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handleDELETE(request as Parameters<typeof handleDELETE>[0], { params: Promise.resolve(params) } as Parameters<typeof handleDELETE>[1]),
);
