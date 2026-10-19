import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {hrActivityQuerySchema} from "@/modules/placements/hr-job-activity-model";
import {listRecruiterJobActivity} from "@/modules/placements/hr-job-activity-service";
import {buildHrActivityCsv,HR_ACTIVITY_CSV_CAP} from "@/modules/placements/hr-activity-csv-model";
export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  const allowed=["collegeId","kind","q"];
  if([...params.keys()].some(key=>!allowed.includes(key))||
     allowed.some(key=>params.getAll(key).length>1))
   return NextResponse.json({error:"INVALID_QUERY"},{status:400});
  const query=hrActivityQuerySchema.parse({
   collegeId:params.get("collegeId")??undefined,kind:params.get("kind")??undefined,q:params.get("q")??undefined,
   limit:100,page:1,
  });
  const context=await getCurrentRequestContext();
  const first=await listRecruiterJobActivity(context,query);
  if(first.status!=="READY")return NextResponse.json({error:"COLLEGE_REQUIRED"},{status:403});
  const rows=[...first.events];
  let additional=false;
  if(first.hasNext&&rows.length<HR_ACTIVITY_CSV_CAP){
   const second=await listRecruiterJobActivity(context,{...query,page:2});
   if(second.status!=="READY"||second.collegeId!==first.collegeId)
    return NextResponse.json({error:"COLLEGE_SCOPE_CHANGED"},{status:403});
   rows.push(...second.events);
   additional=second.hasNext;
  }
  const result=buildHrActivityCsv(rows,additional);
  return new Response(result.csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="' + gridExportFilename("recruiter-hiring-activity", "csv") + '"',
   "Cache-Control":"private, no-store","X-Export-Capped":result.capped?"true":"false",
  }});
 }catch(error){return apiErrorResponse(error);}
}
