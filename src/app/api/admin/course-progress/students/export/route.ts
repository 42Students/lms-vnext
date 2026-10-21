import {getCurrentRequestContext} from "@/auth/request-context";
import {requirePermission} from "@/modules/permissions/policy";
import {parseSuperAdminStudentProgressParams} from "@/modules/courses/super-admin-course-progress-query";
import {apiErrorResponse} from "@/lib/api-error";
import {getSuperAdminStudentCourseProgress} from "@/modules/courses/super-admin-student-course-progress";
import {studentCourseCompletion} from "@/modules/courses/super-admin-student-progress-model";
import {placementReportCsv} from "@/modules/placements/report-model";
export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const context=await getCurrentRequestContext();
  requirePermission(context,"admin-scope.select");
  const search=new URL(request.url).searchParams;
  const keys=[...search.keys()];
  const id=keys.length===1?parseSuperAdminStudentProgressParams({offeringId:search.get("offeringId")??undefined}):null;
  if(!id)
   return Response.json({error:"INVALID_REQUEST"},{status:400,headers:{"Cache-Control":"private, no-store"}});
  // Export all authorized roster pages: the legacy CSV was not limited to
  // the first 500 students and includes both IDs and denominator columns.
  const rows:(string|number|null)[][]=[];
  let page=1;
  while(true){
   const result=await getSuperAdminStudentCourseProgress(context,{offeringId:id,page,pageSize:500});
   rows.push(...result.rows.map(row=>[
    row.membershipId,row.studentName,row.rollNumber??"",
    row.videos,row.totalVideos,row.assignments,row.totalAssignments,
    row.quizzes,row.totalQuizzes,studentCourseCompletion(row),
   ]));
   if(!result.hasMore)break;
   page+=1;
  }
  const csv=placementReportCsv([
   "learnerId","name","rollNumber","videos","videoTotal",
   "assignments","assignmentTotal","quizzes","quizTotal","percent",
  ],rows);
  return new Response("\uFEFF"+csv,{
   headers:{"Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="course-progress-students.csv"',
    "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Vary":"Cookie"},
  });
 }catch(error){return apiErrorResponse(error);}
}
