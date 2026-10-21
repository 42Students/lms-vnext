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

import {collegeClassQuerySchema} from "@/modules/academics/college-structure-directory-model";
import {listCollegeClasses} from "@/modules/academics/college-structure-directory-service";
export async function GET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  const parsed=collegeClassQuerySchema.safeParse({
   q:params.get("q")??undefined,programId:params.get("programId")||undefined,
   cohortCode:params.get("cohortCode")??undefined,
   status:params.get("status")??undefined,page:1,pageSize:100,
  });
  if(!parsed.success)return Response.json({message:"Check your class filters and try again."},{status:400});
  const context=await getCurrentRequestContext();
  const records:Awaited<ReturnType<typeof listCollegeClasses>>["items"]=[];
  let total=0;
  for(let page=1;page<=100;page++){
   const result=await listCollegeClasses(context,{...parsed.data,page});
   if(page===1){
    total=result.total;
    if(total>10000)return Response.json({
      error:"CLASS_EXPORT_TOO_LARGE",
      message:"Filter the list to at most 10,000 classes before exporting."
    },{status:413});
   }else if(result.total!==total){
    return Response.json({error:"CLASS_EXPORT_CHANGED",
      message:"The class directory changed. Refresh and export again."},{status:409});
   }
   records.push(...result.items);
   if(page>=result.totalPages)break;
  }
  const rows:(string|number|null)[][]=records.map(row=>[
   row.id,row.name,row.code,row.programId,row.cohortId,row.description,
   row.capacity,row.activeLearners,row.status,
  ]);
  return csvResponse(["id","name","code","programId","batchId","description",
   "maxStudents","students","status"],rows,"classes.csv",false);
 }catch(error){return apiErrorResponse(error);}
}
