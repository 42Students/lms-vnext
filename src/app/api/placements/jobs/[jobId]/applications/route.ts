import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {createPlacementApplicationInputSchema,placementJobIdSchema} from "@/modules/placements/validation";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {
  applyToPlacementJob,
  listPlacementJobApplications,
} from "@/modules/placements/application-service";

export const runtime = "nodejs";

/** Legacy /api/v1/jobs/{jobId}/apply/{learnerId} maps to this POST.
 * Caller identity comes from authenticated membership, not the request.
 * Job reads: /api/placements/jobs/me; applications: /applications/me;
 * bookmarks: /learner/saved-jobs; offers: /offers/{id}/actions.
 */

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { jobId } = params;
    const applications =
      await listPlacementJobApplications(
        context,
        jobId,
      );
    return NextResponse.json({ applications });
  },
);

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { jobId } = params;
    if(!placementJobIdSchema.safeParse(jobId).success)
      return NextResponse.json({error:"INVALID_REQUEST",
        message:"This drive link is invalid. Open the drive from your college placements page."},
        {status:400,headers:{"Cache-Control":"private, no-store"}});
    let input: unknown;
    try {
      input = await request.json();
    } catch {
      return NextResponse.json({ error: "INVALID_REQUEST",
        message: "Provide a valid JSON application body." },
        { status: 400, headers: { "Cache-Control": "private, no-store" } });
    }
    const application = await applyToPlacementJob(
      context,
      jobId,
      createPlacementApplicationInputSchema.parse(input) as Parameters<typeof applyToPlacementJob>[2],
    );
    return NextResponse.json(
      { application,
        message:"Application submitted. Screening will be completed shortly.",
        screeningStatus:"PENDING_REVIEW",
      },
      {status:201,headers:{"Cache-Control":"private, no-store"}},
    );
  },
);
