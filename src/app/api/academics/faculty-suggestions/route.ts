import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listPopularCollegeFaculty,searchCollegeFacultySuggestions}
 from "@/modules/courses/college-faculty-picker-service";

export const runtime="nodejs";
export const dynamic="force-dynamic";

/** Read-only replacement for legacy faculty search, college and popular
 * pickers. Caller scope comes only from the authenticated role switcher.
 * Management directories retain their separate, paginated read endpoint.
 */
export async function GET(request:Request){
 try{
  const context=await getCurrentRequestContext();
  const collegeId=context.membership?.collegeId??context.adminScope?.collegeId;
  if(!collegeId)return NextResponse.json({error:"COLLEGE_SCOPE_REQUIRED"},{status:403});
  const params=new URL(request.url).searchParams;
  const mode=params.get("mode")??"search";
  if(mode!=="search"&&mode!=="popular")
   return NextResponse.json({error:"INVALID_FACULTY_MODE"},{status:400});
  const result=mode==="popular"
   ?await listPopularCollegeFaculty(context,collegeId,params.get("limit")??10)
   :await searchCollegeFacultySuggestions(context,collegeId,{
    q:params.get("q")??"",
    ...(params.has("limit")?{limit:params.get("limit")}:{}),
    ...(params.has("departmentId")?{departmentId:params.get("departmentId")}:{}),
    ...(params.has("employmentType")?{employmentType:params.get("employmentType")}:{}),
   });
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
