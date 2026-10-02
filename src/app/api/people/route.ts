import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listCollegePeopleWithRuntime } from "@/modules/people/runtime";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const searchParams = new URL(request.url).searchParams;

    const page = await listCollegePeopleWithRuntime(context, {
      collegeId: searchParams.get("collegeId"),
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    });

    return NextResponse.json(page);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
