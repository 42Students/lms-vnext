import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { PeopleServiceError } from "@/modules/people/errors";
import { updateMembershipLifecycleWithRuntime } from "@/modules/people/runtime";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    membershipId: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "INVALID_REQUEST" },
      { status: 400 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const { membershipId } = await params;
    const person = await updateMembershipLifecycleWithRuntime(
      context,
      membershipId,
      body,
    );

    // A transition is college-membership scoped, not an account-wide ban.
    // Return the canonical current row for both legacy status indicators and
    // vNext clients while preserving the pre-existing person envelope.
    return NextResponse.json({
      person,
      membership: person.membership,
      membershipId: person.membership.id,
      // Legacy userType/userId routes referred to a whole account. This
      // replacement only mutates the selected college membership; callers
      // must not interpret SUSPENDED here as a platform-wide user ban.
      scope: "COLLEGE_MEMBERSHIP",
      accountStatusUnchanged: true,
      status: person.membership.status,
      suspendedAt: person.membership.suspendedAt,
      suspensionReason: person.membership.suspensionReason,
    });
  } catch (error) {
    if (error instanceof PeopleServiceError && error.code === "MEMBERSHIP_NOT_FOUND") {
      return NextResponse.json({
        error: "MEMBERSHIP_NOT_FOUND",
        message: "Not found",
      }, { status: 404 });
    }
    return apiErrorResponse(error);
  }
}
