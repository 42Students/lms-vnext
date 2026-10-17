import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {AuthorizationError} from "@/modules/permissions/policy";
import {getTpoVerificationQueue} from "@/modules/placements/tpo-verification-queue-service";
import {verificationCsv} from "@/modules/verification/queue-export";
import {verificationTab} from "@/modules/verification/queue-tabs";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(request:Request){
 try{
  const context=await getCurrentRequestContext();
  const queue=await getTpoVerificationQueue(context);
  if(!queue.available||!queue.enabled||!queue.permitted)
   throw new AuthorizationError("profile-verification.review");
  const stamp=(value:Date)=>new Intl.DateTimeFormat("en-IN",{
    dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
  }).format(value)+" IST";
  const params=new URL(request.url).searchParams;
  const allowedTabs=["WAITING","SENT_BACK","VERIFIED"] as const;
  const tab=params.get("tab");
  const kind=params.get("kind");
  if([...params.keys()].some(key=>!["tab","kind"].includes(key))||
    params.getAll("tab").length>1||params.getAll("kind").length>1||
    (tab&&!allowedTabs.some(value=>value===tab))||
    (kind&&!["EDUCATION","IDENTITY"].includes(kind)))
    return new Response("Invalid queue export filters",{status:400,headers:{"Cache-Control":"private, no-store"}});
  const selected=queue.rows.filter(row=>(!tab||verificationTab(row)===tab)&&
    (!kind||row.section===kind));
  const result=verificationCsv(selected.map(row=>({
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
