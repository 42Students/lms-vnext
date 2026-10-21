import { tpoCrmTablesReady } from "@/modules/placements/tpo-crm-storage-readiness";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { moveTpoFollowup } from "@/modules/placements/tpo-crm-service";
import { calendarFollowupMoveSchema } from "@/modules/placements/tpo-calendar-followup-model";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { tpoCrmFollowupIdSchema } from "@/modules/placements/tpo-crm-validation";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ followupId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  if (!await tpoCrmTablesReady()) {
    return NextResponse.json({ error: "DB09_MIGRATIONS_PENDING" }, { status: 503 });
  }

  try {
    const context = await getCurrentRequestContext();
    if (!hasMembershipRole(context, "TPO") || !context.membership) {
      throw new AuthorizationError("placements.manage");
    }
    const collegeId = context.membership.collegeId;
    await requirePlacementManageScope(context, collegeId);
    const { followupId: rawId } = await params;
    const followupId = tpoCrmFollowupIdSchema.parse(rawId);
    const input = calendarFollowupMoveSchema.parse(await request.json());
    const followup = await moveTpoFollowup(context, followupId, {
      collegeId,
      dueAt: input.dueAt,
    });
    return NextResponse.json({
      followup: {id:followup.id,dueAt:followup.dueAt.toISOString()},
      status:"UPDATED",
    },{headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}

/** Legacy drag/drop calendars POST the move; both verbs go through the
 * same scoped, transactional writer with the current followup UUID. */
export const POST=PATCH;
