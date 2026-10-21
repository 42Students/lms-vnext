import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  CollegeCohortMutationError, updateCollegeCohort,
} from "@/modules/academics/college-cohort-mutation-service";

import { retireCollegeBatch, CollegeBatchRetireError }
  from "@/modules/academics/college-batch-retire-service";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ cohortId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
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

/** Legacy BatchController used PUT. Keep that method as a compatibility
 * alias, while the scoped vNext API remains PATCH. The request still requires
 * the current optimistic token and exact academic UUIDs; integer legacy batch
 * IDs or a year-only body are not silently interpreted. */
export async function PUT(request:Request,route:RouteContext) {
  return PATCH(request,route);
}

/** Retire/archive is intentionally not the legacy destructive SQL DELETE.
 * This preserves references to enrollments and academic periods. Only the
 * existing mutation service can retire eligible batches. */
export async function DELETE(request:Request,{params}:RouteContext) {
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
