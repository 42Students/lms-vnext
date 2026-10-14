import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { createCollegeDepartment } from "@/modules/departments/college-department-mutation-service";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    return NextResponse.json({ department: await createCollegeDepartment(
      context, await request.json(),
    ) }, { status: 201 });
  } catch (error) { return apiErrorResponse(error); }
}
