import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getSuperAdminPlacementRetentionReport } from "@/modules/admin-ui/super-admin-placement-retention-service";
import { requireSuperAdminSelectedCollege } from "@/modules/admin-ui/super-admin-selected-college";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const scope = requireSuperAdminSelectedCollege(context, "placements.read");
    const requestedCollege = new URL(request.url).searchParams.get("collegeId");
    if (!requestedCollege || requestedCollege !== scope.collegeId) {
      return NextResponse.json({ error: "COLLEGE_SCOPE_CHANGED" }, {
        status: 409, headers: { "Cache-Control": "private, no-store" },
      });
    }
    const report = await getSuperAdminPlacementRetentionReport(context);
    return NextResponse.json({
      rows: report.rows.map(row => ({
        id: row.id, jobTitle: row.jobTitle,
        applicationStatus: row.applicationStatus,
        lastUpdated: row.lastUpdated.toISOString(),
      })),
      truncated: report.truncated, cutoff: report.cutoff,
      totalStaleCount: report.truncated ? null : report.rows.length,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
