import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { loadClassTeamRoster } from "@/modules/projects/class-team-roster-service";

export const runtime = "nodejs";
const querySchema = z.object({ collegeId: z.string().uuid(), classId: z.string().uuid() }).strict();
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(url.searchParams));
    const context = await getCurrentRequestContext();
    const roster = await loadClassTeamRoster(context, query.collegeId, query.classId);
    return NextResponse.json({ roster }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
