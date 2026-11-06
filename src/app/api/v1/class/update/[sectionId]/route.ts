import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readBoundedJsonBody } from "@/lib/bounded-json-body";
import {
  CollegeSectionError, updateCollegeSection,
} from "@/modules/academics/college-section-mutation-service";
import { secured } from "@/security/secure-handler";

export const runtime = "nodejs";

/** Legacy PUT /api/v1/class/update/{id} with an OK envelope.
 * Numeric legacy IDs cannot identify a new UUID section; the caller must
 * map its old identity to a scoped persisted section before mutation. */
async function handlePUT(
  request: Request,
  { params }: { params: Promise<{ sectionId: string }> },
) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    const { sectionId } = await params;
    const parsedBody = await readBoundedJsonBody(request, 16_384);
    if (parsedBody.kind !== "OK") return NextResponse.json({ error: "INVALID_REQUEST" }, {
      status: parsedBody.kind === "TOO_LARGE" ? 413 : 400,
      headers: { "Cache-Control": "private, no-store" },
    });
    const body: unknown = parsedBody.value;
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
export const PUT = secured(handlePUT, { csrf: "enforce" });
