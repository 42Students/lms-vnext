import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
import {parseSuperAdminQuizQuery} from "@/modules/admin-ui/super-admin-quiz-query-model";
import {listCollegeAssessmentAggregate} from "@/modules/courses/college-assessment-aggregate-service";

export const runtime="nodejs";
export const dynamic="force-dynamic";
/** Read-only response adapter for the retired Super Admin quiz directory API.
 * The legacy numeric college ID cannot grant access in vNext: current session
 * and the selected-college permission are the sole authorization authority.
 * No question answers, learner submissions or private contacts are included.
 */
export async function GET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  const raw:Record<string,string|string[]|undefined>={};
  for(const key of new Set(params.keys())){
   const values=params.getAll(key);
   raw[key]=values.length===1?values[0]:values;
  }
  const parsed=parseSuperAdminQuizQuery(raw);
  if(!parsed.success)return NextResponse.json({success:false,error:"INVALID_FILTERS"},
   {status:400,headers:{"Cache-Control":"private, no-store"}});
  const context=await getCurrentRequestContext();
  requireSuperAdminSelectedCollege(context,"courses.read");
  const results=await listCollegeAssessmentAggregate(context,"QUIZ",parsed.data);
  return NextResponse.json({success:true,message:"Quizzes fetched successfully",
   data:{items:results.items,total:results.total,page:results.page,
    pageSize:results.pageSize,totalPages:results.totalPages}},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
