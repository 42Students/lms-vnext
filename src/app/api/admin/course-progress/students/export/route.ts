import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getSuperAdminStudentCourseProgress} from "@/modules/courses/super-admin-student-course-progress";
import {studentCourseCompletion} from "@/modules/courses/super-admin-student-progress-model";
import {placementReportCsv} from "@/modules/placements/report-model";
export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const id=new URL(request.url).searchParams.get("offeringId");
  const result=await getSuperAdminStudentCourseProgress(await getCurrentRequestContext(),{offeringId:id});
  const rows=result.rows.map(row=>[row.studentName,
   row.videos,row.assignments,row.quizzes,
   studentCourseCompletion(row)] as const);
  const csv=placementReportCsv(["Student","Videos","Assignments","Quizzes","Progress (%)"],rows);
  return new Response("\uFEFF"+csv,{
   headers:{"Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="course-progress-students.csv"',
    "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Vary":"Cookie"},
  });
 }catch(error){return apiErrorResponse(error);}
}
