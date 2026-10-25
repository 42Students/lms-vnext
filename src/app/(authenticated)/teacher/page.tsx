import {getCurrentRequestContext} from "@/auth/request-context";
import {getFacultyAssessmentOverview} from "@/modules/courses/faculty-assessment-service";
import {getFacultyClassSchedule} from "@/modules/courses/faculty-schedule-service";
import {getDb} from "@/db/client";
import {users} from "@/db/schema";
import {eq} from "drizzle-orm";
import {FacultyTodayPanel,type FacultyTodayTask} from "@/components/faculty/faculty-today-panel";

/** Prototype #02: the Faculty landing page uses real, own-scope workloads.
 * Numbers in the screenshot are sample content, never seeded as fake results. */
export default async function TeacherIndex(){
 const context=await getCurrentRequestContext();
 const [assessments,schedule,profile]=await Promise.all([
  getFacultyAssessmentOverview(context),
  getFacultyClassSchedule(context,{startAt:new Date()}).catch(()=>null),
  getDb().select({displayName:users.displayName}).from(users)
   .where(eq(users.id,context.user.id)).limit(1),
 ]);
 const firstName=profile[0]?.displayName?.trim().split(/\s+/)[0]??"";
 const tasks:FacultyTodayTask[]=[];
 const assignment=[...new Map(assessments.assignments
  .filter(item=>item.hasSubmissions).map(item=>[item.id,item] as const)).values()][0];
 if(assignment)tasks.push({
  id:"submissions-"+assignment.id,eyebrow:"TO GRADE",tone:"warning",
  title:"Review submissions for "+assignment.title,
  detail:assignment.courseName+" · "+assignment.sectionName+
   " · Open the report to check grading status.",
  action:"Grade",href:"/teacher/report/assignment/"+encodeURIComponent(assignment.id)+
   "?deliveryId="+encodeURIComponent(assignment.deliveryId),
 });
 const next=schedule?.nextUpcoming;
 if(next)tasks.push({
  id:"class-"+next.id,eyebrow:"NEXT CLASS",
  title:next.title?.trim()||"Upcoming class",
  detail:next.sectionName+" · "+(next.location??"Location not provided"),
  action:"Open schedule",href:"/teacher/calendar",
 });
 const quiz=[...new Map(assessments.quizzes
  .filter(item=>item.status==="DRAFT"&&item.facultyOwned)
  .map(item=>[item.id,item] as const)).values()][0];
 if(quiz)tasks.push({
  id:"quiz-"+quiz.id,eyebrow:"NOT PUBLISHED",tone:"neutral",
  title:quiz.title+" is still a draft",
  detail:quiz.courseName+" · "+quiz.lessonName+" · Students cannot access it yet.",
  action:"Open quiz",href:"/teacher/allQuizzes?content="+encodeURIComponent(quiz.id),
 });
 const dateLabel=new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",weekday:"long",day:"numeric",month:"long",
 }).format(new Date());
 const hour=Number(new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",hour:"2-digit",hourCycle:"h23"}).format(new Date()));
 const greeting=hour<12?"morning":hour<17?"afternoon":"evening";
 const nextClass=next?"Next class: "+(next.title?.trim()||"Scheduled class")+
  " · "+next.sectionName+" · "+new Intl.DateTimeFormat("en-IN",{
   timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
  }).format(next.startsAt)+" IST.":null;
 return <FacultyTodayPanel tasks={tasks} firstName={firstName} dateLabel={dateLabel} greeting={greeting}
  nextClass={nextClass}/>;
}
