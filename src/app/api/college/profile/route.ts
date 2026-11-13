import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  loadCollegeOwnProfile, updateCollegeOwnProfile,
  CollegeProfileVersionConflict, CollegeProfileVersionRequired,
} from "@/modules/people/college-admin-profile-edit-service";

import { privateJson } from "@/security/responses";
export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor }) => {
    const context = __actor!;
    const profile = await loadCollegeOwnProfile(context);
    return privateJson({ profile });
  },
);
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    try {
const profile = await updateCollegeOwnProfile(context, await boundedRequestJson(request));
return privateJson({ profile });
} catch (error) {
    if(error instanceof CollegeProfileVersionConflict)
      return NextResponse.json({error:"PROFILE_VERSION_CHANGED",
        message:"Profile changed elsewhere. Refresh your profile before saving."},{status:409});
    if(error instanceof CollegeProfileVersionRequired)
      return NextResponse.json({error:"PROFILE_VERSION_REQUIRED",
        message:"Profile version is required. Reload your profile before saving."},{status:400});
    return apiErrorResponse(error);
  }
  },
);
