import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoApplicantLegacyStatus} from "@/modules/placements/tpo-applicant-legacy-status-service";
export const runtime="nodejs";
/** GET has no side effects and never grants tenant access by raw applicant ID. */
export async function GET(_request:Request,{params}:{
 params:Promise<{jobId:string;applicationId:string}>;
}){
 try{
  const {jobId,applicationId}=await params;
  const status=await getTpoApplicantLegacyStatus(
   await getCurrentRequestContext(),{jobId,applicationId});
  return NextResponse.json(status,{headers:{"cache-control":"no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
