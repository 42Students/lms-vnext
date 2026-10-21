import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { addCollegeTermMapping, addCollegeTermMappings, CollegeTermMappingError } from "@/modules/academics/college-term-mapping-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    const input = await request.json();
    const bulk = input && Array.isArray(input.mappings);
    const row = bulk
      ? await addCollegeTermMappings(context, input.mappings)
      : await addCollegeTermMapping(context, input);
    const inserted = bulk ? (row as unknown[]).length : 1;
    return NextResponse.json({ mapping: row,
      ...(bulk ? { skippedCount: input.mappings.length - inserted } : {}) },
      { status: bulk && inserted === 0 ? 200 : 201 });
  } catch (error) {
    if (error instanceof CollegeTermMappingError)
      return NextResponse.json({ error: error.code }, { status: error.code.endsWith("NOT_FOUND") ? 404 : 409 });
    return apiErrorResponse(error);
  }
}
