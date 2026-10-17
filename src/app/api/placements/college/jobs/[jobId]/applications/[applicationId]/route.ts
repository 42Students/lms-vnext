import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {appendCollegeApplicationNote,attachCollegeApplicationOfferLetter,getCollegeApplicationDetail}
 from "@/modules/placements/college-application-detail-service";
export const runtime="nodejs";export const dynamic="force-dynamic";
type Params={params:Promise<{jobId:string;applicationId:string}>};
export async function GET(_req:Request,{params}:Params){
 try{const {jobId,applicationId}=await params;
  const detail=await getCollegeApplicationDetail(await getCurrentRequestContext(),jobId,applicationId);
  return NextResponse.json(detail,{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
export async function POST(req:Request,{params}:Params){
 if(!isSameOriginRequest(req))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{const {jobId,applicationId}=await params;
  return NextResponse.json(await appendCollegeApplicationNote(await getCurrentRequestContext(),
   jobId,applicationId,await req.json()),{status:201,headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
export async function PATCH(req:Request,{params}:Params){
 if(!isSameOriginRequest(req))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{const {jobId,applicationId}=await params;
  return NextResponse.json(await attachCollegeApplicationOfferLetter(await getCurrentRequestContext(),
   jobId,applicationId,await req.json()),{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
