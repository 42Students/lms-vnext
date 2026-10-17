import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {AuthorizationError} from "@/modules/permissions/policy";
import {readTpoVerificationExport} from "@/modules/verification/tpo-queue-export-read-service";
import {tpoVerificationQuerySchema} from "@/modules/verification/tpo-queue-server-model";
import {verificationCsv} from "@/modules/verification/queue-export";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(request:Request){
 try{
  const context=await getCurrentRequestContext();
  const stamp=(value:Date)=>new Intl.DateTimeFormat("en-IN",{
    dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
  }).format(value)+" IST";
  const params=new URL(request.url).searchParams;
  const allowedTabs=["WAITING","SENT_BACK","VERIFIED"] as const;
  const tab=params.get("tab");
  const kind=params.get("kind");
  const search=params.get("search")??"";
  const batchId=params.get("batchId")??undefined;
  const branchId=params.get("branchId")??undefined;
  if([...params.keys()].some(key=>!["tab","kind","search","batchId","branchId"].includes(key))||
    params.getAll("tab").length>1||params.getAll("kind").length>1||params.getAll("search").length>1||
    params.getAll("batchId").length>1||params.getAll("branchId").length>1||
    (tab&&!allowedTabs.some(value=>value===tab))||
    (kind&&!["EDUCATION","IDENTITY"].includes(kind)))
    return new Response("Invalid queue export filters",{status:400,headers:{"Cache-Control":"private, no-store"}});
  const parsed=tpoVerificationQuerySchema.safeParse({
    tab:tab??"WAITING",kind:kind??"ALL",waitingState:"ALL",waitingSince:"ALL",
    search,batchId,branchId,page:1,pageSize:100,
  });
  if(!parsed.success)return new Response("Invalid queue export filters",{
    status:400,headers:{"Cache-Control":"private, no-store"},
  });
  const queue=await readTpoVerificationExport(context,parsed.data);
  if(!queue.available||!queue.enabled||!queue.permitted)
   throw new AuthorizationError("profile-verification.review");
  const selected=queue.rows;
  const result=verificationCsv(selected.map(row=>({
   learnerName:row.learnerName,
   section:row.section,status:row.status,
   submittedAt:stamp(row.submittedAt),reviewedAt:row.decidedAt?stamp(row.decidedAt):"",
   reviewedBy:row.decidedByName?.trim()??"",
   missingDocumentCount:row.section==="IDENTITY"?(row.missingIdentityProof?1:0):(row.marksheets?.missing??0),
   attentionFlags:row.attention.join("; "),
  })));
  return new Response(result.csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="tpo-verification.csv"',
   "Cache-Control":"private, no-store","Vary":"Cookie",
   "X-Content-Type-Options":"nosniff",
   "X-Export-Range":"first-1000-matching-authorized",
   "X-Export-Truncated":queue.hasMore?"true":"false",
  }});
 }catch(error){return apiErrorResponse(error);}
}
