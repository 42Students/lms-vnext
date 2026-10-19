import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {recruiterDriveListQuerySchema} from "@/modules/placements/recruiter-drive-list-model";
import {searchOwnRecruiterDrives} from "@/modules/placements/recruiter-drive-search-service";
import {buildHrDrivesCsv,HR_DRIVE_CSV_CAP} from "@/modules/placements/hr-drives-csv-model";
export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  const allowed=["collegeId","view","q","employment","mode","deadline","sort"];
  if([...params.keys()].some(key=>!allowed.includes(key))||
     allowed.some(key=>params.getAll(key).length>1))
   return NextResponse.json({error:"INVALID_QUERY"},{status:400});
  const query=recruiterDriveListQuerySchema.parse({
   collegeId:params.get("collegeId")??undefined,view:params.get("view")??undefined,
   q:params.get("q")??undefined,employment:params.get("employment")??undefined,
   mode:params.get("mode")??undefined,deadline:params.get("deadline")??undefined,
   sort:params.get("sort")??undefined,page:1,
  });
  const context=await getCurrentRequestContext();
  if(!hasActiveRecruiter(context)||!context.recruiter||
     context.recruiter.userId!==context.user.id)
   return NextResponse.json({error:"NOT_FOUND"},{status:404});
  const collegeId=query.collegeId??(context.recruiter.grants.length===1?
    context.recruiter.grants[0]!.collegeId:null);
  if(!collegeId||!context.recruiter.grants.some(g=>g.collegeId===collegeId))
   return NextResponse.json({error:"NOT_FOUND"},{status:404});
  const result=await searchOwnRecruiterDrives(context,collegeId,{...query,collegeId},new Date(),{
   pageSize:HR_DRIVE_CSV_CAP+1,
  });
  const output=buildHrDrivesCsv(result.rows,result.total>HR_DRIVE_CSV_CAP);
  return new Response(output.csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="' + gridExportFilename("recruiter-drives", "csv") + '"',
   "Cache-Control":"private, no-store","X-Export-Capped":output.truncated?"true":"false",
  }});
 }catch(error){return apiErrorResponse(error);}
}
