import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listFacultyAssignedClassLearners } from "@/modules/people/college-role-directory-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Only a current Faculty assignment to this delivery can expose its roster.
 * No contact fields or global learner directory access are returned. */
export async function GET(request: Request, {
  params,
}: { params: Promise<{ deliveryId: string }> }) {
  try {
    const context = await getCurrentRequestContext();
    const { deliveryId } = await params;
    const search = new URL(request.url).searchParams;
    const rawLimit = search.get("limit") ?? "25";
    if (!/^[1-9][0-9]{0,2}$/.test(rawLimit)) {
      return NextResponse.json({ error: "INVALID_REQUEST", message: "Invalid learner search limit." },
        { status: 400 });
    }
    const data = await listFacultyAssignedClassLearners(context, {
      deliveryId, query: search.get("query") ?? "",
      limit: Number(rawLimit),
    });
    return NextResponse.json({
      status: "OK",
      data: data.items,
      deliveryId: data.deliveryId,
      sectionId: data.sectionId,
      courseId: data.courseId,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
