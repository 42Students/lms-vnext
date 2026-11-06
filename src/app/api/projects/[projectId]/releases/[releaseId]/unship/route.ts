import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  unshipProjectRelease,
} from "@/modules/projects/lifecycle-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { projectId, releaseId } = params;
    const payload:unknown=await request.json().catch(()=>({}));
    const release = await unshipProjectRelease(
      context,
      projectId,
      releaseId,
      payload,
    );
    return NextResponse.json({ release });
  },
);
