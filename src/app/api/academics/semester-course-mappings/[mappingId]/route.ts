import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { removeCollegeTermMapping, CollegeTermMappingError } from "@/modules/academics/college-term-mapping-service";

export const runtime = "nodejs";
export async function DELETE(
  request: Request, { params }: { params: Promise<{ mappingId: string }> },
) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const { mappingId } = await params;
    const context = await getCurrentRequestContext();
    const result = await removeCollegeTermMapping(context, mappingId, await request.json());
    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof CollegeTermMappingError)
      return NextResponse.json({ error: error.code }, { status: error.code.endsWith("NOT_FOUND") ? 404 : 409 });
    return apiErrorResponse(error);
  }
}
