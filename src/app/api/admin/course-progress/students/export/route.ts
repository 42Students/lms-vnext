import { route } from "@/security/route";
import {eq,and} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {courseOfferings,courseSectionDeliveries} from "@/db/schema";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requireRecentDeviceAuthentication} from "@/auth/recent-device-auth";
import {requirePermission} from "@/modules/permissions/policy";
import {parseSuperAdminStudentProgressParams} from "@/modules/courses/super-admin-course-progress-query";
import {apiErrorResponse} from "@/lib/api-error";
import {getSuperAdminStudentCourseProgress} from "@/modules/courses/super-admin-student-course-progress";
import {studentCourseCompletion} from "@/modules/courses/super-admin-student-progress-model";
import {placementReportCsv} from "@/modules/placements/report-model";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "admin-scope.select" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    requirePermission(context,"admin-scope.select");
    await requireRecentDeviceAuthentication(context.user.id);
    const search=new URL(request.url).searchParams;
    const keys=[...search.keys()];
    const allowed=keys.every(key=>key==="offeringId"||key==="deliveryId")&&
   keys.length===new Set(keys).size;
    const id=allowed?parseSuperAdminStudentProgressParams({offeringId:search.get("offeringId")??undefined}):null;
    const deliveryRaw=search.get("deliveryId");
    const deliveryId=deliveryRaw&&z.string().uuid().safeParse(deliveryRaw).success?deliveryRaw:null;
    if(!id||(deliveryRaw!==null&&!deliveryId))
   return Response.json({error:"INVALID_REQUEST"},{status:400,headers:{"Cache-Control":"private, no-store"}});
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
  },
);
