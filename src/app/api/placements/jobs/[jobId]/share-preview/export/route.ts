import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getTpoShareableShortlist } from "@/modules/placements/tpo-shareable-shortlist-service";
import {
  tpoShareableShortlistCsv,
} from "@/modules/placements/tpo-shareable-shortlist-model";
import { route } from "@/security/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ jobId: string }> };
async function handleGET(request: Request, { params }: RouteContext) {
  try {
    const { jobId } = await params;
    const data = await getTpoShareableShortlist(
      await getCurrentRequestContext(),
      { jobId, q:new URL(request.url).searchParams.get("q")??"" }, { exportAll: true },
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
export const GET = route(
  { auth: "user", permission: "service-enforced", stepUp: true },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);
