import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {VerificationUnavailableError} from "@/modules/verification/staff-auth";
import {reviewSuperAdminVerificationBulk} from "@/modules/verification/super-admin-bulk-review-service";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const payload=await request.json();
  const collegeId=z.uuid().parse(payload?.collegeId);
  const {collegeId:_,...body}=payload;
  const result=await reviewSuperAdminVerificationBulk(await getCurrentRequestContext(),collegeId,body);
  // Every selected learner/section has one explicit persisted result or a
  // specific retry reason. A partial batch never reports unconditional success.
  const receipts=result.outcomes.map(item=>({
   learnerMembershipId:item.learnerMembershipId,
   section:item.section,status:item.result,
   success:item.result==="VERIFIED"||item.result==="SENT_BACK",
  }));
  return NextResponse.json({...result,receipts,
   status:result.summary.failed>0?"PARTIAL":"COMPLETE",
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof VerificationUnavailableError)return NextResponse.json({error:"VERIFICATION_STORAGE_PENDING"},{status:503});
  return apiErrorResponse(error);
 }
}
