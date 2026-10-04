import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  getOwnLearnerProfileWithRuntime,
  upsertOwnLearnerProfileDocumentWithRuntime,
} from "@/modules/people/runtime";

export const runtime = "nodejs";

export async function GET() {
  try {
    const context =
      await getCurrentRequestContext();
    const result =
      await getOwnLearnerProfileWithRuntime(
        context,
      );

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context =
      await getCurrentRequestContext();
    const profile =
      await upsertOwnLearnerProfileDocumentWithRuntime(
        context,
        await request.json(),
      );

    return NextResponse.json({ profile });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
