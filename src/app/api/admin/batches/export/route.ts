import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {placementReportCsv} from "@/modules/placements/report-model";
export const runtime="nodejs";
function csvResponse(header:string[],rows:(string|number|null)[][],file:string,truncated:boolean){
 if(truncated)rows.push(["TRUNCATED: refine filters to export fewer records",...Array.from({length:Math.max(0,header.length-1)},()=>"" )]);
 return new Response("\uFEFF"+placementReportCsv(header,rows),{headers:{
  "Content-Type":"text/csv; charset=utf-8",
  "Content-Disposition":'attachment; filename="'+file+'"',
  "Cache-Control":"private, no-store",
  "X-Export-Truncated":String(truncated),
  "X-Content-Type-Options":"nosniff",
 }});
}

import {collegeBatchDirectorySchema} from "@/modules/academics/college-academic-directory-model";
import {listCollegeBatches} from "@/modules/academics/college-academic-directory-service";
export async function GET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  const parsed=collegeBatchDirectorySchema.safeParse({
   q:params.get("q")??undefined,programId:params.get("programId")||undefined,
   status:params.get("status")??undefined,page:1,pageSize:100,
  });
  if(!parsed.success)return Response.json({message:"Check your batch filters and try again."},{status:400});
  const context=await getCurrentRequestContext();
  const records:Awaited<ReturnType<typeof listCollegeBatches>>["items"]=[];
  let total=0;
  for(let page=1;page<=10;page++){
   const result=await listCollegeBatches(context,{...parsed.data,page});
   total=result.total;records.push(...result.items);
   if(page>=result.totalPages)break;
  }
  const rows:(string|number|null)[][]=records.map(row=>[
   row.id,row.name,row.code,row.programId,row.startDate,row.endDate,
   row.academicYear,row.currentTermNumber,row.status,row.activeEnrolledLearners,
  ]);
  return csvResponse(["id","batchName","code","programId","startDate","endDate",
   "academicYear","currentSemester","status","students"],rows,"batches.csv",records.length<total);
 }catch(error){return apiErrorResponse(error);}
}
