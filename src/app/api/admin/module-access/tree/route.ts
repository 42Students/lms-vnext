import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {listCollegeModuleScopePage} from "@/modules/module-access/admin-descendant-rule-write";
import {getSuperAdminCollegeModuleAccess} from "@/modules/module-access/admin-read-service";
import {apiErrorResponse} from "@/lib/api-error";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const query=z.strictObject({
 collegeId:z.string().uuid(),
 page:z.coerce.number().int().min(1).max(10000).default(1),
});
/** Exact academic scope inventory, not merely persisted overrides.
 * Pages contain 500 authorized descendants, including nodes whose decisions
 * are wholly inherited. Clients follow hasMore to retrieve the full tree.
 * Learner-specific membership nodes stay behind the authorized trace flow
 * rather than materializing 10,000 students in one response.
 */
export async function GET(request:Request){
 try{
  const url=new URL(request.url);
  const input=query.parse({
   collegeId:url.searchParams.get("collegeId")??undefined,
   page:url.searchParams.get("page")??undefined,
  });
  const context=await getCurrentRequestContext();
  const [college,tree]=await Promise.all([
   getSuperAdminCollegeModuleAccess(context,input.collegeId,{}),
   listCollegeModuleScopePage(context,input.collegeId,input.page),
  ]);
  if(!college)return NextResponse.json({error:"COLLEGE_NOT_FOUND"},{status:404});
  return NextResponse.json({
   college:college.college,
   modules:college.modules,ancestors:college.ancestors,
   scopeTypes:{COHORT:"Batch",SECTION:"Class",MEMBERSHIP:"Learner"},
   items:tree.items,
   page:tree.page,total:tree.total,totalPages:tree.totalPages,
   hasMore:tree.hasMore,pageSize:500,
   description:"Every academic scope in the selected college, including inherited-only nodes.",
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
