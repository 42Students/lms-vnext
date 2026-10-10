import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { collegeIdSchema } from "@/modules/academics/validation";
import { listProjectMentorCandidates } from "@/modules/projects/member-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const context =
      await getCurrentRequestContext();
    const collegeId = collegeIdSchema.parse(
      url.searchParams.get("collegeId"),
    );
    const mentors =
      await listProjectMentorCandidates(
        context,
        collegeId,
        {
          q: url.searchParams.get("q") ?? "",
          limit:
            url.searchParams.get("limit") ??
            "50",
        },
      );

    return NextResponse.json({ mentors });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
