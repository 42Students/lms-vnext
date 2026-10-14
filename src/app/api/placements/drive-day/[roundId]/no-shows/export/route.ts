import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { getTpoRoundDriveDay } from "@/modules/placements/tpo-round-drive-day-service";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { tpoRoundAttendanceCsv } from "@/modules/placements/tpo-operations-export-model";
import { buildTpoNoShowReport } from "@/modules/placements/tpo-no-show-model";
import { placementRoundIdSchema } from "@/modules/placements/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ roundId: string }> };

/** An explicitly absent-only subset of the existing authorized round export. */
export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentRequestContext();
    if (!context.membership || !hasMembershipRole(context, "TPO")) {
      throw new AuthorizationError("placements.manage");
    }
    const collegeId = context.membership.collegeId;
    if (!can(context, "placements.manage", { collegeId })) {
      throw new AuthorizationError("placements.manage");
    }
    requirePermission(context, "placements.manage", { collegeId });
    await requirePlacementManageScope(context, collegeId);
    const { roundId } = await params;
    const data = await getTpoRoundDriveDay(context, placementRoundIdSchema.parse(roundId));
    const explicitAbsences = buildTpoNoShowReport(data.rows).explicitAbsences;
    const csv = tpoRoundAttendanceCsv({ ...data, rows: explicitAbsences });
    return new Response("\uFEFF" + csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="tpo-round-explicit-no-shows.csv"',
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        Vary: "Cookie",
      },
    });
  } catch (error) {
    const response = apiErrorResponse(error);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Vary", "Cookie");
    return response;
  }
}
