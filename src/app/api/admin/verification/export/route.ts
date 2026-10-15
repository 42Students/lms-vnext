import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {z} from "zod";
import {exportCollegeVerificationCsv} from "@/modules/verification/staff-export-service";
import {VerificationQueueLimitError} from "@/modules/verification/staff-queue-service";
import {VerificationUnavailableError} from "@/modules/verification/staff-auth";
export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  const collegeId=z.uuid().parse(params.get("collegeId"));
  const pairs=[...params.entries()];
  if(pairs.length!==new Set(pairs.map(([k])=>k)).size)
   return NextResponse.json({error:"DUPLICATE_FILTER"},{status:400});
  const raw=Object.fromEntries(pairs.filter(([name])=>name!=="collegeId"));
  const report=await exportCollegeVerificationCsv(await getCurrentRequestContext(),raw,collegeId);
  return new Response(report.csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="super-admin-profile-verification.csv"',
   "Cache-Control":"private, no-store",
   "X-Export-Truncated":String(report.truncated),
   "X-Export-Total":String(report.total),
  }});
 }catch(error){
  if(error instanceof VerificationUnavailableError)
   return NextResponse.json({error:error.message},{status:503});
  if(error instanceof VerificationQueueLimitError)
   return NextResponse.json({error:error.message},{status:409});
  return apiErrorResponse(error);
 }
}
