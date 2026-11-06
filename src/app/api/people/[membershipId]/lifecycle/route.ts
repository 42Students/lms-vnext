import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { requireRecentDeviceAuthentication } from "@/auth/recent-device-auth";
import { readBoundedAuthJson, AuthRequestBodyTooLarge } from "@/modules/auth/bounded-json";
import { membershipLifecycleInputSchema } from "@/modules/people/validation";
import { apiErrorResponse } from "@/lib/api-error";
import { PeopleServiceError } from "@/modules/people/errors";
import { updateMembershipLifecycleWithRuntime } from "@/modules/people/runtime";
import { secured } from "@/security/secure-handler";

export const runtime = "nodejs";

/** Legacy /api/v1/admin/users/{userType}/{userId}/suspend and /reactivate
 * contracts are RETIRED rather than silently redirected: their numeric
 * account IDs and account-wide semantics cannot identify the selected college
 * membership. Integrators must resolve a scoped UUID membership and issue
 * PATCH /api/people/{membershipId}/lifecycle with a same-origin request.
 * Neither a numeric legacy ID nor a role label can authorize this mutation.
 */
export const LEGACY_ACCOUNT_LIFECYCLE_CONTRACT="RETIRED_ACCOUNT_WIDE_API" as const;

type RouteContext = {
  params: Promise<{
    membershipId: string;
  }>;
};

async function handlePATCH(
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
    body = await readBoundedAuthJson(request, 2_048);
  } catch (error) {
    const tooLarge=error instanceof AuthRequestBodyTooLarge;
    return NextResponse.json(
      { error: tooLarge?"REQUEST_TOO_LARGE":"INVALID_REQUEST" },
      { status: tooLarge?413:400 },
    );
  }

  try {
    const input=membershipLifecycleInputSchema.parse(body);
    const context = await getCurrentRequestContext();
    // Suspending, reactivating or ending a college membership changes live
    // authorization and must not be possible from a stale admin session.
    await requireRecentDeviceAuthentication(context.user.id);
    const { membershipId } = await params;
    const person = await updateMembershipLifecycleWithRuntime(
      context,
      membershipId,
      input,
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
      legacyAccountLifecycleContract:LEGACY_ACCOUNT_LIFECYCLE_CONTRACT,
      status: person.membership.status,
      suspendedAt: person.membership.suspendedAt,
      suspensionReason: person.membership.suspensionReason,
    }, { headers: { "Cache-Control": "private, no-store", "Vary": "Cookie" } });
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
export const PATCH = secured(handlePATCH);
