import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  loadCollegeOwnProfile, updateCollegeOwnProfile,
  CollegeProfileVersionConflict, CollegeProfileVersionRequired,
} from "@/modules/people/college-admin-profile-edit-service";
import { secured } from "@/security/secure-handler";

export const runtime = "nodejs";

async function handleGET() {
  try {
    const context = await getCurrentRequestContext();
    const profile = await loadCollegeOwnProfile(context);
    return NextResponse.json({ profile }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiErrorResponse(error); }
}
export const GET = secured(handleGET);
async function handlePATCH(request: Request) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    const profile = await updateCollegeOwnProfile(context, await request.json());
    return NextResponse.json({ profile },{headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    if(error instanceof CollegeProfileVersionConflict)
      return NextResponse.json({error:"PROFILE_VERSION_CHANGED",
        message:"Profile changed elsewhere. Refresh your profile before saving."},{status:409});
    if(error instanceof CollegeProfileVersionRequired)
      return NextResponse.json({error:"PROFILE_VERSION_REQUIRED",
        message:"Profile version is required. Reload your profile before saving."},{status:400});
    return apiErrorResponse(error);
  }
}
export const PATCH = secured(handlePATCH, { csrf: "enforce" });
