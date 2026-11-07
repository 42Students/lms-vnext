import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  CollegeCohortMutationError, updateCollegeCohort,
} from "@/modules/academics/college-cohort-mutation-service";

import { retireCollegeBatch, CollegeBatchRetireError }
  from "@/modules/academics/college-batch-retire-service";
import { route } from "@/security/route";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ cohortId: string }> };

async function handlePATCH(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { cohortId } = await params;
    const body: unknown = await request.json();
    const cohort = await updateCollegeCohort(context, cohortId, body);
    return NextResponse.json({
      status:"OK",message:"Batch updated successfully",success:true,
      cohort,data:cohort,idKind:"UUID",lifecycle:"ARCHIVE_NOT_HARD_DELETE",
    });
  } catch (error) {
    if (error instanceof CollegeCohortMutationError) {
      return NextResponse.json({ error: error.code }, {
        status: error.code.endsWith("NOT_FOUND") ? 404 : 409,
      });
    }
    return apiErrorResponse(error);
  }
}
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePATCH(request as Parameters<typeof handlePATCH>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePATCH>[1]),
);

/** Legacy BatchController used PUT. Keep that method as a compatibility
 * alias, while the scoped vNext API remains PATCH. The request still requires
 * the current optimistic token and exact academic UUIDs; integer legacy batch
 * IDs or a year-only body are not silently interpreted. */
async function handlePUT(request:Request,route:RouteContext) {
  return PATCH(request,route);
}
export const PUT = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePUT(request as Parameters<typeof handlePUT>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePUT>[1]),
);

/** Retire/archive is intentionally not the legacy destructive SQL DELETE.
 * This preserves references to enrollments and academic periods. Only the
 * existing mutation service can retire eligible batches. */
async function handleDELETE(request:Request,{params}:RouteContext) {
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try {
    const {cohortId}=await params;
    const result=await retireCollegeBatch(await getCurrentRequestContext(),cohortId,await request.json());
    return NextResponse.json({
      status:"OK",message:"Batch archived successfully",success:true,
      cohort:result,data:result,idKind:"UUID",lifecycle:"ARCHIVE_NOT_HARD_DELETE",
    });
  }catch(error) {
    if(error instanceof CollegeBatchRetireError)
      return NextResponse.json({error:error.code},{status:error.code==="BATCH_NOT_FOUND"?404:409});
    return apiErrorResponse(error);
  }
}
export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handleDELETE(request as Parameters<typeof handleDELETE>[0], { params: Promise.resolve(params) } as Parameters<typeof handleDELETE>[1]),
);
