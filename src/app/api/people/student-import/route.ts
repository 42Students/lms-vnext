import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/auth/origin";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { runCollegeStudentCsv } from "@/modules/people/college-student-csv-service";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    return NextResponse.json({
      report: await runCollegeStudentCsv(await getCurrentRequestContext(), await request.json()),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
