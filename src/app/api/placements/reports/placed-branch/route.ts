import { route } from "@/security/route";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getTpoPlacedStudentsByBranch } from "@/modules/placements/tpo-placed-branch-service";
import { tpoPlacedBranchCsv } from "@/modules/placements/tpo-placed-branch-model";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const report = await getTpoPlacedStudentsByBranch(context,
      Object.fromEntries(new URL(request.url).searchParams.entries()));
    if (!report.season) {
      return Response.json({ error: "PLACEMENT_SEASON_NOT_FOUND" }, {
        status: 404,
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      });
    }
    const exported = tpoPlacedBranchCsv(report.season.name, report);
    return new Response("\uFEFF" + exported.csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="tpo-placed-by-branch.csv"',
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        Vary: "Cookie",
        "X-Export-Truncated": String(exported.truncated),
      },
    });
  },
);
