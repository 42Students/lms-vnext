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
    return NextResponse.json({ cohort });
  } catch (error) {
    if (error instanceof CollegeCohortMutationError) {
      return NextResponse.json({ error: error.code }, {
        status: error.code.endsWith("NOT_FOUND") ? 404 : 409,
      });
    }
    return apiErrorResponse(error);
  }
}

export async function DELETE(request:Request,{params}:RouteContext) {
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try {
    const {cohortId}=await params;
    const result=await retireCollegeBatch(await getCurrentRequestContext(),cohortId,await request.json());
    return NextResponse.json({cohort:result});
  }catch(error) {
    if(error instanceof CollegeBatchRetireError)
      return NextResponse.json({error:error.code},{status:error.code==="BATCH_NOT_FOUND"?404:409});
    return apiErrorResponse(error);
  }
}
