import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {duplicateCollegeDrive} from "@/modules/placements/college-drive-clone-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{jobId:string}>}){
 if(!isSameOriginRequest(request))return Response.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {jobId}=await params,ctx=await getCurrentRequestContext();
  return Response.json(await duplicateCollegeDrive(ctx,jobId,await request.json()),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
