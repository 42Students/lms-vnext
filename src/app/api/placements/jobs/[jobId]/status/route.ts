import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  closePlacementJob,
  publishPlacementJob,
} from "@/modules/placements/job-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

const inputSchema = z
  .object({
    action: z.enum(["PUBLISH", "CLOSE"]),
  })
  .strict();

export async function POST(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }

  try {
    const context = await getCurrentRequestContext();
    const { jobId } = await params;
    const { action } = inputSchema.parse(await request.json());
    const job =
      action === "PUBLISH"
        ? await publishPlacementJob(context, jobId)
        : await closePlacementJob(context, jobId);
    return NextResponse.json(job);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
