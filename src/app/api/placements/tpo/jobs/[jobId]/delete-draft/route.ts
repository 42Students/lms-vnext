import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {deleteTpoUnpublishedDraft} from "@/modules/placements/tpo-delete-draft-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{jobId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {jobId}=await params;
  const result=await deleteTpoUnpublishedDraft(await getCurrentRequestContext(),
   jobId,await request.json());
  return NextResponse.json(result,{status:result.archived?200:409});
 }catch(error){return apiErrorResponse(error)}
}
