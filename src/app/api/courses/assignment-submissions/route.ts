import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {
  listAssignmentSubmissions,
} from "@/modules/courses/assignment-submission-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context =
      await getCurrentRequestContext();
    const url = new URL(request.url);
    const submissions =
      await listAssignmentSubmissions(
        context,
        url.searchParams.get(
          "assignmentId",
        ) ?? "",
        url.searchParams.get("deliveryId") ??
          "",
      );

    return NextResponse.json({ submissions });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
