import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getTpoShareableShortlist } from "@/modules/placements/tpo-shareable-shortlist-service";
import {
  tpoShareableShortlistCsv,
} from "@/modules/placements/tpo-shareable-shortlist-model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ jobId: string }> };
export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { jobId } = await params;
    const data = await getTpoShareableShortlist(
      await getCurrentRequestContext(),
      { jobId }, { exportAll: true },
    );
    return new Response("\uFEFF" + tpoShareableShortlistCsv(data.rows, data.truncated), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="tpo-recruiter-visible-shortlist.csv"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        Vary: "Cookie",
      },
    });
  } catch (error) {
    const response = apiErrorResponse(error);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
}
