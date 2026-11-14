import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { collegeIdSchema } from "@/modules/academics/validation";
import { listProjectMentorCandidates } from "@/modules/projects/member-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "projects.manage" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const url = new URL(request.url);
    const collegeId = collegeIdSchema.parse(
      url.searchParams.get("collegeId"),
    );
    const mentors =
      await listProjectMentorCandidates(
        context,
        collegeId,
        {
          q: url.searchParams.get("q") ?? "",
          limit:url.searchParams.get("limit") ?? "50",
          offset:Number(url.searchParams.get("offset")??"0"),
        },
      );
    return NextResponse.json({ mentors });
  },
);
