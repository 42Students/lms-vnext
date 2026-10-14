import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { changeTpoSeason } from "@/modules/placements/tpo-season-write-service";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    const season = await changeTpoSeason(context, await request.json());
    return NextResponse.json({ season });
  } catch (error) { return apiErrorResponse(error); }
}
