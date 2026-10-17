import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {duplicateCollegeDrive} from "@/modules/placements/college-drive-clone-service";
export const runtime="nodejs";
export async function POST(req:Request,{params}:{params:Promise<{jobId:string}>}){
 if(!isSameOriginRequest(req))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{const {jobId}=await params;
  return NextResponse.json(await duplicateCollegeDrive(await getCurrentRequestContext(),jobId,await req.json()),{
   headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error)}
}
