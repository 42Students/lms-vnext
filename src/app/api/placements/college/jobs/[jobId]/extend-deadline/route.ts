import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {extendCollegeDriveDeadline} from "@/modules/placements/college-drive-deadline-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handlePOST(req:Request,{params}:{params:Promise<{jobId:string}>}){
 if(!isSameOriginRequest(req))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{const {jobId}=await params;
  return NextResponse.json(await extendCollegeDriveDeadline(await getCurrentRequestContext(),
   jobId,await req.json()),{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const POST = secured(handlePOST, { csrf: "enforce" });
