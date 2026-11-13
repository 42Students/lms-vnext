import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getSuperAdminPlacementRetentionReport } from "@/modules/admin-ui/super-admin-placement-retention-service";
import { requireSuperAdminSelectedCollege } from "@/modules/admin-ui/super-admin-selected-college";

import { CACHE } from "@/security/responses";
export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "placements.read" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const scope = requireSuperAdminSelectedCollege(context, "placements.read");
    const requestedCollege = new URL(request.url).searchParams.get("collegeId");
    if (!requestedCollege || requestedCollege !== scope.collegeId) {
      return NextResponse.json({ error: "COLLEGE_SCOPE_CHANGED" }, {
        status: 409, headers: { "Cache-Control": CACHE.PRIVATE },
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
    }, { headers: { "Cache-Control": CACHE.PRIVATE } });
  },
);
