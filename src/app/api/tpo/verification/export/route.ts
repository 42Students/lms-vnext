import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {AuthorizationError} from "@/modules/permissions/policy";
import {getTpoVerificationQueue} from "@/modules/placements/tpo-verification-queue-service";
import {verificationCsv} from "@/modules/verification/queue-export";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(){
 try{
  const context=await getCurrentRequestContext();
  const queue=await getTpoVerificationQueue(context);
  if(!queue.available||!queue.enabled||!queue.permitted)
   throw new AuthorizationError("profile-verification.review");
  const stamp=(value:Date)=>new Intl.DateTimeFormat("en-IN",{
    dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
  }).format(value)+" IST";
  const result=verificationCsv(queue.rows.map(row=>({
   learnerName:row.learnerName,
   section:row.section,status:row.status,
   submittedAt:stamp(row.submittedAt),reviewedAt:"",
   missingDocumentCount:row.marksheets?.missing??(row.missingIdentityProof?1:0),
   attentionFlags:row.attention.join("; "),
  })));
  return new Response(result.csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="tpo-verification.csv"',
   "Cache-Control":"private, no-store","Vary":"Cookie",
   "X-Content-Type-Options":"nosniff",
   "X-Export-Range":"first-100-authorized",
  }});
 }catch(error){return apiErrorResponse(error);}
}
