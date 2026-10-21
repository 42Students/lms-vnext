import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  CollegeSectionError, updateCollegeSection,
} from "@/modules/academics/college-section-mutation-service";

export const runtime = "nodejs";

/** Legacy PUT /api/v1/class/update/{id} with an OK envelope.
 * Numeric legacy IDs cannot identify a new UUID section; the caller must
 * map its old identity to a scoped persisted section before mutation. */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ sectionId: string }> },
) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    const { sectionId } = await params;
    const body: unknown = await request.json();
    const section = await updateCollegeSection(context, sectionId, body);
    return NextResponse.json({ status: "OK", message: "OK", data: section },
      { status: 200, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof CollegeSectionError) {
      return NextResponse.json({
        status: "ERROR", message: error.code, data: null,
      }, { status: error.code === "CLASS_NOT_FOUND" ||
        error.code === "CLASS_COHORT_NOT_FOUND" ? 404 : 409,
        headers: { "Cache-Control": "private, no-store" } });
    }
    return apiErrorResponse(error);
  }
}
