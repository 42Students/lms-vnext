import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  shipProjectRelease,
} from "@/modules/projects/lifecycle-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { projectId, releaseId } = params;
    const payload:unknown=await boundedRequestJson(request).catch(()=>({}));
    const release = await shipProjectRelease(
      context,
      projectId,
      releaseId,
      payload,
    );
    return NextResponse.json({ release });
  },
);
