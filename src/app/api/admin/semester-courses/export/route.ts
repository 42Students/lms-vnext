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

import {listCollegeTermMappings} from "@/modules/academics/college-term-mapping-service";
export async function GET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  const status=params.get("status")??"ALL",q=(params.get("q")??"").trim().toLocaleLowerCase("en-IN");
  if(!["ALL","ACTIVE","INACTIVE"].includes(status)||q.length>100)
   return Response.json({message:"Check your mapping filters and try again."},{status:400});
  const context=await getCurrentRequestContext();
  const result=await listCollegeTermMappings(context);
  const matching=result.mapped.filter(row=>{
   const term=result.terms.find(item=>item.id===row.termId);
   return (status==="ALL"||(status==="ACTIVE" ? term?.isActive===true:term?.isActive===false)) &&
    (!q||[row.courseName,row.courseCode,row.programName,row.termName].some(s=>s.toLocaleLowerCase("en-IN").includes(q)));
  });
  const records=matching.slice(0,1000);
  const rows:(string|number|null)[][]=records.map(row=>[
   row.id,row.termId,row.courseId,row.courseName,row.courseCode,row.credits,row.displayOrder,row.type,
  ]);
  return csvResponse(["id","semesterId","courseId","course","courseCode","credits","order","type"],
   rows,"semester-course-mapping.csv",matching.length>records.length);
 }catch(error){return apiErrorResponse(error);}
}
