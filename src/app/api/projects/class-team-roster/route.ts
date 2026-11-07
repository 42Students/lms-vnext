import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { loadClassTeamRoster } from "@/modules/projects/class-team-roster-service";

export const runtime = "nodejs";
const querySchema = z.object({ collegeId: z.string().uuid(), classId: z.string().uuid() }).strict();
export const GET = route(
  { auth: "user", permission: "projects.manage" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const url = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(url.searchParams));
    const roster = await loadClassTeamRoster(context, query.collegeId, query.classId);
    return NextResponse.json({ roster }, { headers: { "Cache-Control": "no-store" } });
  },
);
