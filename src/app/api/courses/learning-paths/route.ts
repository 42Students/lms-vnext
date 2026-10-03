import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createLearningPath,
  listLearningPaths,
} from "@/modules/courses/learning-path-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    const learningPaths =
      await listLearningPaths(
        context,
        url.searchParams.get("offeringId") ?? "",
        url.searchParams.get("deliveryId"),
        url.searchParams.get("includeArchived") ===
          "true",
      );

    return NextResponse.json({ learningPaths });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const body = await request.json();
    const learningPath =
      await createLearningPath(
        context,
        body,
      );

    return NextResponse.json(
      { learningPath },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
