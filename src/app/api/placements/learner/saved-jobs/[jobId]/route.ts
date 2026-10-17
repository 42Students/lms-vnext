import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {saveOwnPlacementJob,unsaveOwnPlacementJob} from "@/modules/placements/saved-job-service";
export const runtime="nodejs";
type RouteContext={params:Promise<{jobId:string}>};
export async function POST(request:Request,{params}:RouteContext){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {jobId}=await params;
  const saved=await saveOwnPlacementJob(await getCurrentRequestContext(),jobId);
  return NextResponse.json({saved:Boolean(saved)},{status:200});
 }catch(error){return apiErrorResponse(error);}
}
export async function DELETE(request:Request,{params}:RouteContext){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {jobId}=await params;
  const result=await unsaveOwnPlacementJob(await getCurrentRequestContext(),jobId);
  return NextResponse.json(result);
 }catch(error){return apiErrorResponse(error);}
}
