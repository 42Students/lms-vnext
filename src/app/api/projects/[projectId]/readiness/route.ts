import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  getProjectReadiness,
} from "@/modules/projects/readiness-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { projectId } = params;
    const readiness = await getProjectReadiness(
      context,
      projectId,
    );
    return NextResponse.json({ readiness });
  },
);
