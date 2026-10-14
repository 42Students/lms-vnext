import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { tpoBranchSeasonQuerySchema, tpoBranchSeasonCsv } from "@/modules/placements/tpo-branch-season-model";
import { getTpoBranchSeasonDashboard } from "@/modules/placements/tpo-branch-season-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const query = tpoBranchSeasonQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );
    const context = await getCurrentRequestContext();
    const data = await getTpoBranchSeasonDashboard(context, query);
    const csv = tpoBranchSeasonCsv(data.season?.name ?? "No season", data.rows);
    return new Response("\uFEFF" + csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="tpo-branch-season.csv"',
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        Vary: "Cookie",
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
