import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  loadCollegeOwnProfile, updateCollegeOwnProfile,
} from "@/modules/people/college-admin-profile-edit-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const context = await getCurrentRequestContext();
    const profile = await loadCollegeOwnProfile(context);
    return NextResponse.json({ profile }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiErrorResponse(error); }
}
export async function PATCH(request: Request) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    const profile = await updateCollegeOwnProfile(context, await request.json());
    return NextResponse.json({ profile });
  } catch (error) { return apiErrorResponse(error); }
}
