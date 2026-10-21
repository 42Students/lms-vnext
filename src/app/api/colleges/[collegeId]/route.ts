import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ADMIN_SCOPE_COOKIE_NAME } from "@/auth/admin-scope";
import { isSameOriginRequest } from "@/auth/origin";
import {
  archiveCollege,
  updateCollege,
} from "@/modules/colleges/service";
import { apiErrorResponse } from "@/lib/api-error";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    collegeId: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const { collegeId } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "INVALID_REQUEST" },
        { status: 400 },
      );
    }

    // Legacy allowed moving a college or reusing its unique ID. In the
    // membership-based tenant model these are identity invariants: changing
    // them would reparent roles, domains and historical audit records.
    // Require an explicitly authorized migration to a newly created college.
    if(!body||typeof body!=="object"||Array.isArray(body))
      return NextResponse.json({error:"INVALID_REQUEST",message:"Failed to update college. Please try again or contact support."},{status:400});
    const values=body as Record<string,unknown>;
    // Legacy PUT accepted a full CollegeDTO. This PATCH accepts only mutable
    // metadata; organization, unique ID and DNS ownership have separate,
    // audited migration and verified-domain workflows.
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
  } catch (error) {
    return apiErrorResponse(error);
  }
}


export async function DELETE(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context =
      await getCurrentRequestContext();
    const { collegeId } = await params;
    const college = await archiveCollege(
      context,
      collegeId,
    );

    // DELETE is intentionally a reversible soft archive, not physical
    // deletion. Dependency checks are performed before the status mutation.
    // Existing memberships and audit records remain held under this college;
    // restoration requires a separately authorized explicit request.
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
      response.cookies.set(
        ADMIN_SCOPE_COOKIE_NAME,
        "",
        {
          httpOnly: true,
          secure:
            process.env.NODE_ENV ===
            "production",
          sameSite: "lax",
          path: "/",
          maxAge: 0,
        },
      );
    }

    return response;
  } catch (error) {
    return apiErrorResponse(error);
  }
}
