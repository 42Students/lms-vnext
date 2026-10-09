import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import { listDueTpoFollowups } from "@/modules/placements/tpo-crm-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const collegeId = new URL(request.url).searchParams.get("collegeId") ?? "";
    const followups = await listDueTpoFollowups(context, collegeId);
    return NextResponse.json({ followups });
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}
