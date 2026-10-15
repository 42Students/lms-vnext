import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listProjectTeamClasses } from "@/modules/projects/class-team-roster-service";

export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { collegeId } = z.object({ collegeId: z.string().uuid() }).strict().parse(Object.fromEntries(url.searchParams));
    const context = await getCurrentRequestContext();
    const classes = await listProjectTeamClasses(context, collegeId);
    return NextResponse.json({ classes }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}