import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {recruiterDriveListQuerySchema,filterRecruiterDrives,sortRecruiterDrives} from "@/modules/placements/recruiter-drive-list-model";
import {listOwnRecruiterPlacementJobs} from "@/modules/placements/recruiter-service";
import {buildHrDrivesCsv,HR_DRIVE_CSV_CAP} from "@/modules/placements/hr-drives-csv-model";
export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  const query=recruiterDriveListQuerySchema.parse({
   collegeId:params.get("collegeId")??undefined,view:params.get("view")??undefined,
   q:params.get("q")??undefined,employment:params.get("employment")??undefined,
   mode:params.get("mode")??undefined,deadline:params.get("deadline")??undefined,
   sort:params.get("sort")??undefined,page:1,
  });
  const context=await getCurrentRequestContext();
  if(!hasActiveRecruiter(context)||!context.recruiter)
   return NextResponse.json({error:"NOT_FOUND"},{status:404});
  const collegeId=query.collegeId??(context.recruiter.grants.length===1?
    context.recruiter.grants[0]!.collegeId:null);
  if(!collegeId||!context.recruiter.grants.some(g=>g.collegeId===collegeId))
   return NextResponse.json({error:"NOT_FOUND"},{status:404});
  const jobs=(await listOwnRecruiterPlacementJobs(context)).filter(row=>
   row.collegeId===collegeId&&row.companyId===context.recruiter!.companyId);
  const sorted=sortRecruiterDrives(filterRecruiterDrives(jobs,{...query,collegeId},new Date()),query.sort);
  const output=buildHrDrivesCsv(sorted.slice(0,HR_DRIVE_CSV_CAP+1),sorted.length>HR_DRIVE_CSV_CAP);
  return new Response(output.csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="recruiter-drives.csv"',
   "Cache-Control":"private, no-store","X-Export-Capped":output.truncated?"true":"false",
  }});
 }catch(error){return apiErrorResponse(error);}
}
