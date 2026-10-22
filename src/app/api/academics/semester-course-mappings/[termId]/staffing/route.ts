import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {CollegeTermMappingError,getCollegeTermStaffingReport} from "@/modules/academics/college-term-mapping-service";

export const runtime="nodejs";
export const dynamic="force-dynamic";

/** Legacy GET /api/v1/semester/:semesterId/staffing, translated to the
 * authenticated acting-college UUID term rather than trusting numeric IDs.
 * This is a read-only report: mapping writes use separate authorized routes.
 */
export async function GET(_request:Request,{params}:{params:Promise<{termId:string}>}){
 try{
  const {termId}=await params;
  const result=await getCollegeTermStaffingReport(await getCurrentRequestContext(),termId);
  return NextResponse.json({status:"OK",message:"OK",data:result.courses,
   term:result.term,totalClasses:result.totalClasses,
   historicalClassCount:result.historicalClassCount,source:result.source},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof CollegeTermMappingError)
   return NextResponse.json({error:error.code},{status:error.code==="TERM_NOT_FOUND"?404:409,
    headers:{"Cache-Control":"private, no-store"}});
  return apiErrorResponse(error);
 }
}
