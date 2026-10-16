import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getTpoAfterCollegeReport} from "@/modules/placements/tpo-after-college-report-service";
import {AFTER_COLLEGE_LABELS} from "@/modules/placements/tpo-after-college-model";
import {apiErrorResponse} from "@/lib/api-error";
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
  const parsed=params.parse({batchId:q.get("batchId")||undefined,branchId:q.get("branchId")||undefined});
  const ctx=await getCurrentRequestContext();
  if(!ctx.membership)return NextResponse.json({error:"UNAUTHORIZED"},{status:403});
  const data=await getTpoAfterCollegeReport(ctx,{collegeId:ctx.membership.collegeId,...parsed});
  if(!data.available)return NextResponse.json({error:"AFTER_COLLEGE_STORAGE_PENDING"},{status:503});
  const header=["Student","Roll no.","Batch","Branch","After college","Applications"];
  const rows=data.rows.map(row=>[row.displayName,row.rollNumber,row.cohortName,row.branchName,
   AFTER_COLLEGE_LABELS[row.outcome],row.applicationCount]);
  return new Response([header,...rows].map(row=>row.map(csv).join(",")).join("\r\n")+"\r\n",
   {headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":"attachment; filename=after-college.csv",
    "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
 }catch(error){return apiErrorResponse(error);}
}
