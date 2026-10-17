import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {collegeInterviewFilters,listCollegeInterviewDirectory} from "@/modules/placements/college-interview-directory-service";
import {collegeInterviewCsv} from "@/modules/placements/college-directory-csv";
export const runtime="nodejs";
export async function GET(request:Request) {
 try{
  const raw=Object.fromEntries(new URL(request.url).searchParams);
  const parsed=collegeInterviewFilters.safeParse(raw);
  if(!parsed.success)return NextResponse.json({error:"INVALID_INTERVIEW_FILTERS"},{status:400});
  const result=await listCollegeInterviewDirectory(await getCurrentRequestContext(),parsed.data,{exportAll:true});
  if(!result.ready)return NextResponse.json({error:"INTERVIEWS_UNAVAILABLE"},{status:503});
  return new Response(collegeInterviewCsv(result.rows),{
   headers:{"Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="interviews.csv"',
    "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff",
    "X-Export-Truncated":result.limited?"true":"false"},
  });
 }catch(error){return apiErrorResponse(error);}
}
