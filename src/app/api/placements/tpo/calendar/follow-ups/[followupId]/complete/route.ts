import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { finishTpoFollowup } from "@/modules/placements/tpo-crm-service";
import { tpoCrmTablesReady } from "@/modules/placements/tpo-crm-storage-readiness";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { tpoCrmFollowupIdSchema } from "@/modules/placements/tpo-crm-validation";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ followupId: string }> };

/** Completing a calendar item uses the same scoped writer as the recruiter lead workspace. */
export async function POST(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  if (!await tpoCrmTablesReady()) {
    return NextResponse.json({ error: "DB09_MIGRATIONS_PENDING" }, { status: 503 });
  }
  try {
    const context = await getCurrentRequestContext();
    if (!context.membership || !hasMembershipRole(context, "TPO")) {
      throw new AuthorizationError("placements.manage");
    }
    const collegeId = context.membership.collegeId;
    await requirePlacementManageScope(context, collegeId);
    const { followupId: rawId } = await params;
    const followup = await finishTpoFollowup(
      context, collegeId, tpoCrmFollowupIdSchema.parse(rawId),
    );
    // Legacy clients used 204 No Content. Keep the existing JSON response
    // for the vNext calendar while supporting explicit minimal-response callers.
    // finishTpoFollowup is idempotent: a repeated Done returns the original
    // timestamp without writing a second completion.
    if(request.headers.get("prefer")?.split(",").some(value=>value.trim()==="return=minimal"))
      return new NextResponse(null,{status:204,headers:{
        "Cache-Control":"private, no-store","Preference-Applied":"return=minimal",
      }});
    return NextResponse.json({
      followup: { id: followup.id, doneAt: followup.doneAt?.toISOString() ?? null },
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}
