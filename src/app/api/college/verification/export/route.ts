import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {exportCollegeVerificationCsv} from "@/modules/verification/staff-export-service";
import {VerificationQueueLimitError} from "@/modules/verification/staff-queue-service";
import {VerificationUnavailableError} from "@/modules/verification/staff-auth";
export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const params=Object.fromEntries(new URL(request.url).searchParams);
  const report=await exportCollegeVerificationCsv(await getCurrentRequestContext(),params);
  return new Response(report.csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="college-profile-verification.csv"',
   "Cache-Control":"private, no-store",
   "X-Export-Truncated":String(report.truncated),"X-Export-Total":String(report.total),
  }});
 }catch(error){
  if(error instanceof VerificationUnavailableError)return NextResponse.json({error:error.message},{status:503});
  if(error instanceof VerificationQueueLimitError)return NextResponse.json({error:error.message},{status:409});
  if(error instanceof Error&&error.message==="VERIFICATION_FILTER_NOT_SUPPORTED")
   return NextResponse.json({error:"FILTER_NOT_SUPPORTED"},{status:400});
  return apiErrorResponse(error);
 }
}
