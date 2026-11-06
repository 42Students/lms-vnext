import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  reopenProjectSprint,
} from "@/modules/projects/lifecycle-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { projectId, sprintId } = params;
    const sprint = await reopenProjectSprint(
      context,
      projectId,
      sprintId,
    );
    return NextResponse.json({ sprint });
  },
);
