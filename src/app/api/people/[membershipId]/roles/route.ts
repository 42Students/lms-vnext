import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { MEMBERSHIP_ROLE_LABELS, type MembershipRole } from "@/modules/identity/constants";
import {
  addMembershipRoleWithRuntime,
  listMembershipRolesWithRuntime,
  removeMembershipRoleWithRuntime,
} from "@/modules/people/runtime";

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
      body: await request.json() as unknown,
    };
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "INVALID_REQUEST" },
        { status: 400 },
      ),
    };
  }
}

export async function GET(
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

    return NextResponse.json({ roles, roleLabels:roleLabels(roles) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(
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
    const { membershipId } = await params;
    const roles = await addMembershipRoleWithRuntime(
      context,
      membershipId,
      parsedBody.body,
    );

    return NextResponse.json({ roles, roleLabels:roleLabels(roles) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(
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
    const { membershipId } = await params;
    const roles = await removeMembershipRoleWithRuntime(
      context,
      membershipId,
      parsedBody.body,
    );

    return NextResponse.json({ roles, roleLabels:roleLabels(roles) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
