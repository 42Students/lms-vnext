import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {collegeSemesterDirectorySchema} from "@/modules/academics/college-academic-directory-model";
import {listCollegeSemesters} from "@/modules/academics/college-academic-directory-service";
import {placementReportCsv} from "@/modules/placements/report-model";
export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  const parsed=collegeSemesterDirectorySchema.safeParse({
   q:params.get("q")??undefined,
   programId:params.get("programId")||undefined,
   status:params.get("status")??undefined,
   page:1,pageSize:100,
  });
  if(!parsed.success)return Response.json({error:"INVALID_SEMESTER_FILTERS"},{status:400});
  const context=await getCurrentRequestContext();
  const records:Awaited<ReturnType<typeof listCollegeSemesters>>["items"]=[];
  let total=0;
  for(let page=1;page<=10;page++){
   const result=await listCollegeSemesters(context,{...parsed.data,page});
   total=result.total;
   records.push(...result.items);
   if(page>=result.totalPages)break;
  }
  const rows:(string|number|null)[][]=records.map(s=>[
   s.id,s.name,s.termNumber,s.programId,s.programName,s.mappedCredits,s.mappedCourses,s.isActive?"TRUE":"FALSE",
  ]);
  if(records.length<total)rows.push(["TRUNCATED to first 1000 matching semesters","","","","","","",""]);
  return new Response("\uFEFF"+placementReportCsv([
   "id","name","semesterNumber","programId","program","totalCredits","courses","isActive",
  ],rows),{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="semesters.csv"',
   "Cache-Control":"private, no-store",
   "X-Export-Truncated":records.length<total?"true":"false",
  }});
 }catch(error){return apiErrorResponse(error);}
}
