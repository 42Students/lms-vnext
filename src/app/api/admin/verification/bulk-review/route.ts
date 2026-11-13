import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/request-body";
import {VerificationUnavailableError} from "@/modules/verification/staff-auth";
import {reviewSuperAdminVerificationBulk} from "@/modules/verification/super-admin-bulk-review-service";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    try {
const _p=await readBoundedJsonRequest(request,16384);
if(!_p.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
const payload=_p.value;
const payloadObj=payload as Record<string,unknown>;
const collegeId=z.uuid().parse(payloadObj.collegeId);
const {collegeId:_,...body}=payloadObj;
const result=await reviewSuperAdminVerificationBulk(__ctx,collegeId,body);
const receipts=result.outcomes.map(item=>({
   learnerMembershipId:item.learnerMembershipId,
   section:item.section,status:item.result,
   success:item.result==="VERIFIED"||item.result==="SENT_BACK",
  }));
return NextResponse.json({...result,receipts,
   status:result.summary.failed>0?"PARTIAL":"COMPLETE",
  },{headers:{"Cache-Control":CACHE.PRIVATE}});
} catch(error){
  if(error instanceof VerificationUnavailableError)return NextResponse.json({error:"VERIFICATION_STORAGE_PENDING"},{status:503});
  return apiErrorResponse(error);
 }
  },
);
