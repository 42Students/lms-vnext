import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoNonApplicantReminderPreview,remindTpoNonApplicants} from "@/modules/placements/tpo-remind-not-applied-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";export const dynamic="force-dynamic";
type Props={params:Promise<{jobId:string}>};
async function handleGET(_request:Request,{params}:Props){
 try{const {jobId}=await params;
  return NextResponse.json(await getTpoNonApplicantReminderPreview(await getCurrentRequestContext(),jobId),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
export const GET = secured(handleGET);
async function handlePOST(request:Request,{params}:Props){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{const {jobId}=await params;
  return NextResponse.json(await remindTpoNonApplicants(await getCurrentRequestContext(),jobId,await request.json()),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
export const POST = secured(handlePOST, { csrf: "enforce" });
