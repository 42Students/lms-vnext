import { route } from "@/security/route";
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
export const GET = route(
  { auth: "user", permission: "academics.read" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {semesterId:termId}=params;
const result=await getCollegeTermStaffingReport(__ctx,termId);
return NextResponse.json({status:"OK",message:"OK",data:result.courses,
   term:result.term,totalClasses:result.totalClasses,
   historicalClassCount:result.historicalClassCount,source:result.source},
   {headers:{"Cache-Control":"private, no-store"}});
} catch(error){
  if(error instanceof CollegeTermMappingError)
   return NextResponse.json({error:error.code},{status:error.code==="TERM_NOT_FOUND"?404:409,
    headers:{"Cache-Control":"private, no-store"}});
  return apiErrorResponse(error);
 }
  },
);
