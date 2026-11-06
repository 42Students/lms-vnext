import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { requireRecentDeviceAuthentication } from "@/auth/recent-device-auth";
import { membershipRoleMutationInputSchema } from "@/modules/people/validation";
import { readBoundedAuthJson, AuthRequestBodyTooLarge } from "@/modules/auth/bounded-json";
import { requirePermission } from "@/modules/permissions/policy";
import { apiErrorResponse } from "@/lib/api-error";
import { MEMBERSHIP_ROLE_LABELS, type MembershipRole } from "@/modules/identity/constants";
import {
  addMembershipRoleWithRuntime,
  listMembershipRolesWithRuntime,
  removeMembershipRoleWithRuntime,
} from "@/modules/people/runtime";
import { secured } from "@/security/secure-handler";

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
      headers: { "Cache-Control": "private, no-store", "Vary": "Cookie" },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const GET = secured(handleGET);

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
    if (input.role === "COLLEGE_ADMIN" || input.role === "TPO") {
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
      headers: { "Cache-Control": "private, no-store", "Vary": "Cookie" },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const POST = secured(handlePOST);

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
    if (input.role === "COLLEGE_ADMIN" || input.role === "TPO") {
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
      headers: { "Cache-Control": "private, no-store", "Vary": "Cookie" },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const DELETE = secured(handleDELETE);
