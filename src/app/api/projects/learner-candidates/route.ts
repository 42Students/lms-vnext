import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listCollegeProjectLearnerCandidates } from "@/modules/projects/project-learner-candidates-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const collegeId = z.string().uuid().parse(url.searchParams.get("collegeId"));
    const result = await listCollegeProjectLearnerCandidates(
      await getCurrentRequestContext(), collegeId, {
        q: url.searchParams.get("q") ?? "",
        limit: url.searchParams.get("limit") ?? "50",
        offset: url.searchParams.get("offset") ?? "0",
      },
    );
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
