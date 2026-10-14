import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getTpoPlacedStudentsByBranch } from "@/modules/placements/tpo-placed-branch-service";
import { tpoPlacedBranchCsv } from "@/modules/placements/tpo-placed-branch-model";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const report = await getTpoPlacedStudentsByBranch(context,
      Object.fromEntries(new URL(request.url).searchParams.entries()));
    const exported = tpoPlacedBranchCsv(report.season?.name ?? "No season", report);
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
  } catch (caught) {
    const response = apiErrorResponse(caught);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  }
}
