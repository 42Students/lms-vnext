import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { ADMIN_SCOPE_COOKIE_NAME } from "@/auth/admin-scope";
import {
  archiveCollege,
  updateCollege,
} from "@/modules/colleges/service";

import { clearAuthCookie } from "@/auth/cookies";
export const runtime = "nodejs";

export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { collegeId } = params;
    let body: unknown;
    try {
      body = await boundedRequestJson(request);
    } catch {
      return NextResponse.json(
        { error: "INVALID_REQUEST" },
        { status: 400 },
      );
    }
    if(!body||typeof body!=="object"||Array.isArray(body))
      return NextResponse.json({error:"INVALID_REQUEST",message:"Failed to update college. Please try again or contact support."},{status:400});
    const values=body as Record<string,unknown>;
    if(["organizationId","code","uniqueId","collegeCode"].some(key=>key in values))
      return NextResponse.json({
        error:"IMMUTABLE_COLLEGE_IDENTITY",
        message:"College code and organization cannot be changed. Create a new college and plan an authorized membership, domain and record migration.",
      },{status:409});
    if(["host","domain","subdomain","tenantDomain","tenantDomains"].some(key=>key in values))
      return NextResponse.json({error:"DOMAIN_CHANGE_REQUIRES_VERIFICATION",message:"Change web addresses in the college domain manager so ownership, TLS and routing remain verified."},{status:409});
    const college = await updateCollege(
      context,
      collegeId,
      values,
    );
    return NextResponse.json({status:"OK",message:"College updated successfully",data:college,college});
  },
);


export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { collegeId } = params;
    const college = await archiveCollege(
      context,
      collegeId,
    );
    const response = NextResponse.json({
      status:"OK",message:"College archived successfully",
      legacyMessage:"College deleted successfully",data:college,college,
      operation:"ARCHIVED",
      archivedRecordRetained:true,
      restoreRequiresReview:true,
      selectedCollegeScopeCleared:context.adminScope?.collegeId===college.id,
    });
    if (
      context.adminScope?.collegeId ===
      college.id
    ) {
      clearAuthCookie(response, ADMIN_SCOPE_COOKIE_NAME);
    }
    return response;
  },
);
