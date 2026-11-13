import { boundedRequestJson } from "@/lib/bounded-request-json";
import { tpoCrmTablesReady } from "@/modules/placements/tpo-crm-storage-readiness";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { addTpoFollowup } from "@/modules/placements/tpo-crm-service";
import { calendarFollowupCreateSchema } from "@/modules/placements/tpo-calendar-followup-model";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { route } from "@/security/route";

import { ROLE } from "@/modules/identity/roles";
export const runtime = "nodejs";
/** Old POST /api/v1/tpo/recruiter-leads/{leadId}/follow-ups maps to
 * POST /api/placements/tpo/calendar/follow-ups with {leadId,dueAt,note}.
 * College/lead ownership and missing-lead 404 remain enforced.
 */

async function handlePOST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  if (!await tpoCrmTablesReady()) {
    return NextResponse.json({ error: "DB09_MIGRATIONS_PENDING" }, { status: 503 });
  }

  try {
    const context = await getCurrentRequestContext();
    if (!hasMembershipRole(context, ROLE.TPO) || !context.membership) {
      throw new AuthorizationError("placements.manage");
    }
    const collegeId = context.membership.collegeId;
    await requirePlacementManageScope(context, collegeId);
    const input = calendarFollowupCreateSchema.parse(await boundedRequestJson(request));
    const followup = await addTpoFollowup(context, input.leadId, {
      collegeId,
      dueAt: input.dueAt,
      note: input.note,
    });
    if (!followup) throw new Error("TPO_FOLLOWUP_INSERT_RETURNED_NO_ROW");
    return NextResponse.json(
      { followup: { id: followup.id, leadId: input.leadId, dueAt: followup.dueAt.toISOString() } },
      { status: 201 },
    );
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
