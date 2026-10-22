import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { previewCollegeInterviewConflicts } from "@/modules/placements/college-interview-conflict-preview";

export const runtime="nodejs";
export const dynamic="force-dynamic";
type Props={params:Promise<{jobId:string}>};

/** Same-origin authenticated preview; no cross-tenant records or candidate
 * identifiers from other jobs are accepted, and all results are aggregate.
 */
export async function POST(request:Request,{params}:Props){
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const {jobId}=await params;
    return NextResponse.json(
      await previewCollegeInterviewConflicts(
        await getCurrentRequestContext(),jobId,await request.json(),
      ),{headers:{"Cache-Control":"private, no-store"}},
    );
  }catch(error){return apiErrorResponse(error);}
}
