import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {listTpoBatches} from "@/modules/placements/tpo-batch-workspace-read-service";
import {getTpoAfterCollegeReport} from "@/modules/placements/tpo-after-college-report-service";
import {AFTER_COLLEGE_LABELS} from "@/modules/placements/tpo-after-college-model";
import {apiErrorResponse} from "@/lib/api-error";
import {tpoReportHasRepeatedSearchParams} from "@/modules/placements/tpo-report-url-guard";
import {z} from "zod";
const params=z.object({batchId:z.uuid().optional(),branchId:z.uuid().optional()}).strict();
const csv=(v:unknown)=>{
 const value=String(v??"");
 const safe=/^[\s]*[=+\-@\t\r]/.test(value)?"'"+value:value;
 return '"'+safe.replaceAll('"','""')+'"';
};
export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const q=new URL(request.url).searchParams;
  if(tpoReportHasRepeatedSearchParams(q)||[...q.keys()].some(key=>key!=="batchId"&&key!=="branchId"))
   return NextResponse.json({error:"INVALID_QUERY"},{status:400,headers:{"Cache-Control":"private, no-store"}});
  const parsed=params.parse({batchId:q.get("batchId")||undefined,branchId:q.get("branchId")||undefined});
  const ctx=await getCurrentRequestContext();
  if(!ctx.membership)return NextResponse.json({error:"UNAUTHORIZED"},{status:403});
  if(parsed.batchId){
   const batches=await listTpoBatches(ctx);
   if(!batches.batches.some(item=>item.id===parsed.batchId))
    return NextResponse.json({error:"INVALID_BATCH"},{status:422});
  }
  const data=await getTpoAfterCollegeReport(ctx,{collegeId:ctx.membership.collegeId,...parsed});
  if(parsed.branchId&&!data.branches.some(branch=>branch.id===parsed.branchId))
   return NextResponse.json({error:"INVALID_BRANCH"},{status:422});
  if(!data.available)return NextResponse.json({error:"AFTER_COLLEGE_STORAGE_PENDING"},{status:503});
  const header=["Student","Roll no.","Batch","Branch","After college","Applications"];
  const rows=data.rows.slice(0,5000).map(row=>[row.displayName,row.rollNumber,row.cohortName,row.branchName,
   AFTER_COLLEGE_LABELS[row.outcome],row.applicationCount]);
  return new Response([header,...rows].map(row=>row.map(csv).join(",")).join("\r\n")+"\r\n",
   {headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":"attachment; filename=after-college.csv",
    "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff",
    "X-Export-Truncated":data.rows.length>rows.length?"true":"false",Vary:"Cookie"}});
 }catch(error){return apiErrorResponse(error);}
}
