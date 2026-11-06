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
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {semesterId:termId}=params;
    const result=await getCollegeTermStaffingReport(__ctx,termId);
    return NextResponse.json({status:"OK",message:"OK",data:result.courses,
   term:result.term,totalClasses:result.totalClasses,
   historicalClassCount:result.historicalClassCount,source:result.source},
   {headers:{"Cache-Control":"private, no-store"}});
  },
);
