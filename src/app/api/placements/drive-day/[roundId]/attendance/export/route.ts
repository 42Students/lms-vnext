import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { tpoRoundAttendanceCsv } from "@/modules/placements/tpo-operations-export-model";
import { getTpoRoundDriveDay } from "@/modules/placements/tpo-round-drive-day-service";
import { placementRoundIdSchema } from "@/modules/placements/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ roundId: string }> };

/**
 * No supplied college identifier. The roster service independently resolves
 * the persisted round and rechecks the authenticated TPO's college scope.
 */
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
    const { roundId } = await params;
    const data = await getTpoRoundDriveDay(
      context,
      placementRoundIdSchema.parse(roundId),
    );
    return new Response("\uFEFF" + tpoRoundAttendanceCsv(data), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="tpo-drive-day-attendance.csv"',
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        Vary: "Cookie",
      },
    });
  } catch (error) {
    const response = apiErrorResponse(error);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  }
}
