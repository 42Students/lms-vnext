import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { changeTpoRecruiterGrant } from "@/modules/placements/tpo-recruiter-grant-write-service";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    return NextResponse.json(await changeTpoRecruiterGrant(context, await request.json()));
  } catch (error) { return apiErrorResponse(error); }
}
