import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getRecruiterCompanyTeam} from "@/modules/placements/recruiter-company-team-service";
import {buildHrTeamCsv} from "@/modules/placements/hr-team-csv-model";
export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const selected=z.string().uuid().parse(new URL(request.url).searchParams.get("collegeId"));
  const context=await getCurrentRequestContext();
  const data=await getRecruiterCompanyTeam(context,selected);
  if(data.status!=="READY"||data.grant.collegeId!==selected)
   return NextResponse.json({error:"COLLEGE_NOT_FOUND"},{status:404});
  const result=buildHrTeamCsv(data.team);
  return new Response(result.csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="recruiter-company-team.csv"',
   "Cache-Control":"private, no-store",
   "X-Export-Capped":result.truncated?"true":"false",
  }});
 }catch(error){return apiErrorResponse(error);}
}
