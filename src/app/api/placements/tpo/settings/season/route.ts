import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { changeTpoSeason,TpoSettingsStaleError } from "@/modules/placements/tpo-season-write-service";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    const season = await changeTpoSeason(context, await request.json());
    return NextResponse.json({ season });
  } catch (error) {
    if(error instanceof TpoSettingsStaleError)
      return NextResponse.json({error:"TPO_SETTINGS_STALE"},{status:409});
    return apiErrorResponse(error);
  }
}
