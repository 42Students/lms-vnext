import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createPlacementJob,
  listPlacementJobs,
} from "@/modules/placements/job-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const collegeId = new URL(request.url).searchParams.get("collegeId");
    const jobs = await listPlacementJobs(context, collegeId ?? "");
    return NextResponse.json({ jobs });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }

  try {
    const context = await getCurrentRequestContext();
    const body = await request.json();
    const job = await createPlacementJob(context, body);
    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
