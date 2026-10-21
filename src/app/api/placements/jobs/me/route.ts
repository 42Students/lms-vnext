import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listLearnerPlacementJobs } from "@/modules/placements/learner-job-service";
import { summarizeLegacyLearnerJobs } from "@/modules/placements/legacy-job-read-adapter";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  if ([...search.keys()].some(key => key !== "legacy") ||
      (search.has("legacy") && search.get("legacy") !== "1")) {
    return NextResponse.json({error:"INVALID_QUERY"},{status:400});
  }
  const legacy = search.get("legacy") === "1";
  try {
    const context = await getCurrentRequestContext();
    const jobs = await listLearnerPlacementJobs(
      context,
    );
    if (legacy) return NextResponse.json({
      status: "OK", message: "Visible jobs retrieved successfully",
      data: summarizeLegacyLearnerJobs(jobs),
    }, {headers: {"Cache-Control":"private, no-store"}});
    return NextResponse.json({ jobs }, {headers: {"Cache-Control":"private, no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}
