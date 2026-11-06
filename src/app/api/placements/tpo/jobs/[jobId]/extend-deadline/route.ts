import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {extendTpoDriveDeadline,getTpoDriveDeadlineState} from "@/modules/placements/tpo-drive-deadline-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handlePOST(request:Request,{params}:{params:Promise<{jobId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{const {jobId}=await params;
  return NextResponse.json(await extendTpoDriveDeadline(await getCurrentRequestContext(),jobId,await request.json()));
 }catch(error){return apiErrorResponse(error);}
}
export const POST = secured(handlePOST, { csrf: "enforce" });

async function handleGET(_request:Request,{params}:{params:Promise<{jobId:string}>}){
 try{const {jobId}=await params;
  return NextResponse.json(await getTpoDriveDeadlineState(await getCurrentRequestContext(),jobId),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const GET = secured(handleGET);
