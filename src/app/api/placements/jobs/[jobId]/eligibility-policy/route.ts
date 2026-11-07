import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  getJobEligibilityPolicy,
  upsertJobEligibilityPolicy,
} from "@/modules/placements/eligibility-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { jobId } = params;
    const policy =
      await getJobEligibilityPolicy(
        context,
        jobId,
      );
    return NextResponse.json({ policy });
  },
);

export const PUT = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { jobId } = params;
    const policy = await upsertJobEligibilityPolicy(
      context,
      jobId,
      await boundedRequestJson(request),
    );
    return NextResponse.json({ policy });
  },
);
