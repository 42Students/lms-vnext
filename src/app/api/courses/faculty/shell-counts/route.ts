import {NextResponse} from "next/server";
import {and,eq,inArray,sql} from "drizzle-orm";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getDb} from "@/db/client";
import {assignmentSubmissions,courseAssignments} from "@/db/schema";
import {getFacultyAssessmentOverview} from "@/modules/courses/faculty-assessment-service";
import {getFacultyClassSchedule} from "@/modules/courses/faculty-schedule-service";

export const runtime="nodejs";
/** Live workload counts from current Faculty grants, never shared with
 * the College, Mentor, Recruiter, or TPO navigation. */
export async function GET(){
 try{
  const context=await getCurrentRequestContext();
  const assessments=await getFacultyAssessmentOverview(context);
  const deliveries=[...new Set(assessments.assignments.map(item=>item.deliveryId))];
  const ids=[...new Set(assessments.assignments.map(item=>item.id))];
  const pairs=new Set(assessments.assignments.map(item=>item.id+":"+item.deliveryId));
  const candidates=ids.length&&deliveries.length?await getDb().select({
   assignmentId:assignmentSubmissions.assignmentId,
   deliveryId:assignmentSubmissions.deliveryId,
   count:sql<number>`count(*)::int`,
  }).from(assignmentSubmissions)
   .innerJoin(courseAssignments,eq(courseAssignments.id,assignmentSubmissions.assignmentId))
   .where(and(
    inArray(assignmentSubmissions.assignmentId,ids),
    inArray(assignmentSubmissions.deliveryId,deliveries),
    eq(courseAssignments.status,"PUBLISHED"),
    sql`${assignmentSubmissions.gradingStatus} <> 'GRADED'`,
   )).groupBy(assignmentSubmissions.assignmentId,assignmentSubmissions.deliveryId):[];
  const pending=candidates.filter(item=>pairs.has(item.assignmentId+":"+item.deliveryId));
  const toGrade=pending.reduce((sum,item)=>sum+item.count,0);
  const drafts=assessments.quizzes.filter(item=>item.status==="DRAFT"&&item.facultyOwned).length;
  const now=new Date();
  const schedule=await getFacultyClassSchedule(context,{
   startAt:new Date(now.getTime()-86400000),
   endAt:new Date(now.getTime()+86400000),
  }).catch(()=>null);
  const key=(date:Date)=>new Intl.DateTimeFormat("en-CA",{
   timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  }).format(date);
  const todayKey=key(now);
  const todayEvents=new Set((schedule?.events??[]).filter(item=>
   key(item.startsAt)===todayKey&&item.startsAt<=now).map(item=>item.id));
  return NextResponse.json({
   today:pending.length+drafts+todayEvents.size,
   assessments:toGrade+drafts,
  },{headers:{"Cache-Control":"private, no-store","Vary":"Cookie"}});
 }catch(error){return apiErrorResponse(error);}
}
