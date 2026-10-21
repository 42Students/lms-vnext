import {eq,and} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {courseOfferings,courseSectionDeliveries} from "@/db/schema";
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
  // Offering identifies the course; an optional delivery UUID identifies a
  // single class. Never trust caller-supplied course/class names for CSV paths.
  const allowed=keys.every(key=>key==="offeringId"||key==="deliveryId")&&
   keys.length===new Set(keys).size;
  const id=allowed?parseSuperAdminStudentProgressParams({offeringId:search.get("offeringId")??undefined}):null;
  const deliveryRaw=search.get("deliveryId");
  const deliveryId=deliveryRaw&&z.string().uuid().safeParse(deliveryRaw).success?deliveryRaw:null;
  if(!id||(deliveryRaw!==null&&!deliveryId))
   return Response.json({error:"INVALID_REQUEST"},{status:400,headers:{"Cache-Control":"private, no-store"}});
  // Export all authorized roster pages: the legacy CSV was not limited to
  // the first 500 students and includes both IDs and denominator columns.
  const rows:(string|number|null)[][]=[];
  let authorizedCourseId:string|null=null,authorizedSectionId:string|null=null;
  let page=1;
  while(true){
   const result=await getSuperAdminStudentCourseProgress(context,{
    offeringId:id,...(deliveryId?{deliveryId}:{}),page,pageSize:500,
   });
   rows.push(...result.rows.map(row=>[
    row.membershipId,row.studentName,row.rollNumber??"",
    row.videos,row.totalVideos,row.assignments,row.totalAssignments,
    row.quizzes,row.totalQuizzes,studentCourseCompletion(row),
   ]));
   if(!result.hasMore)break;
   page+=1;
  }
  // Only run metadata lookups after the college-scoped progress reader
  // authorizes the offering and any delivery. Filename identifiers come from
  // persisted relations, never from unverified request query fields.
  const [offering]=await getDb().select({courseId:courseOfferings.courseId})
   .from(courseOfferings).where(eq(courseOfferings.id,id)).limit(1);
  authorizedCourseId=offering?.courseId??null;
  if(deliveryId){
   const [delivery]=await getDb().select({sectionId:courseSectionDeliveries.sectionId})
    .from(courseSectionDeliveries).where(and(
     eq(courseSectionDeliveries.id,deliveryId),eq(courseSectionDeliveries.offeringId,id),
    )).limit(1);
   authorizedSectionId=delivery?.sectionId??null;
  }
  const fileName="course-progress-"+(authorizedCourseId??id)+"-class-"+
   (authorizedSectionId??"all")+".csv";
  const csv=placementReportCsv([
   "learnerId","name","rollNumber","videos","videoTotal",
   "assignments","assignmentTotal","quizzes","quizTotal","percent",
  ],rows);
  return new Response("\uFEFF"+csv,{
   headers:{"Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="'+fileName+'"',
    "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Vary":"Cookie"},
  });
 }catch(error){return apiErrorResponse(error);}
}
