import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { bulkReassignProjectMentor } from "@/modules/projects/member-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context =
      await getCurrentRequestContext();
    const input = await request.json();
    const result =
      await bulkReassignProjectMentor(
        context,
        input,
      );
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
