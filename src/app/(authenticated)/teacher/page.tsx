import {getCurrentRequestContext} from "@/auth/request-context";
import {getFacultyAssessmentOverview} from "@/modules/courses/faculty-assessment-service";
import {getFacultyClassSchedule} from "@/modules/courses/faculty-schedule-service";
import {listAssignmentSubmissions} from "@/modules/courses/assignment-submission-service";
import {getDb} from "@/db/client";
import {courseDiscussionMessages} from "@/db/schema";
import {listFacultyCourseDeliveries} from "@/modules/courses/faculty-course-service";
import {users} from "@/db/schema";
import {and,desc,eq,gte,inArray,isNull} from "drizzle-orm";
import {FacultyTodayPanel,type FacultyTodayTask,
 type FacultyTodayClass,type FacultyTodayDeadline} from "@/components/faculty/faculty-today-panel";

const dateKey=(date:Date)=>new Intl.DateTimeFormat("en-CA",{
 timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
}).format(date);
const clock=(date:Date)=>new Intl.DateTimeFormat("en-IN",{
 timeZone:"Asia/Kolkata",hour:"numeric",minute:"2-digit",hour12:true,
}).format(date);

/** Newest Faculty Today prototype, bound to real authorized timetable and
 * assessment records. Never substitute the prototype's example figures. */
export default async function TeacherIndex(){
 const context=await getCurrentRequestContext();
 const now=new Date();
 const [assessments,schedule,profile]=await Promise.all([
  getFacultyAssessmentOverview(context),
  getFacultyClassSchedule(context,{
    startAt:new Date(now.getTime()-86400000),
    endAt:new Date(now.getTime()+8*86400000),
  }).catch(()=>null),
  getDb().select({displayName:users.displayName}).from(users)
   .where(eq(users.id,context.user.id)).limit(1),
 ]);
 const firstName=profile[0]?.displayName?.trim().split(/\s+/)[0]??"";
 const dateLabel=new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",weekday:"long",day:"numeric",month:"long",
 }).format(now);
 const hour=Number(new Intl.DateTimeFormat("en-GB",{
  timeZone:"Asia/Kolkata",hour:"2-digit",hourCycle:"h23",
 }).format(now));
 const greeting=hour<12?"morning":hour<17?"afternoon":"evening";
 const upcoming=schedule?.nextUpcoming??null;
 const nextClass=upcoming?
  "Next class: "+(upcoming.courseName??upcoming.title??"Scheduled class")+
  " · "+upcoming.sectionName+" · "+clock(upcoming.startsAt)+" IST"+(upcoming.location?", "+upcoming.location:""):
  null;
 const todayKey=dateKey(now);
 const todayEvents=[...new Map((schedule?.events??[])
  .filter(event=>dateKey(event.startsAt)===todayKey)
  .map(event=>[event.id,event] as const)).values()];
 const dailyClasses:FacultyTodayClass[]=todayEvents.slice(0,5).map(event=>({
  id:event.id,title:event.courseCode??event.title,sectionName:event.sectionName,
  timeLabel:clock(event.startsAt),location:event.location,learnerCount:null,
  href:event.deliveryId?
   "/teacher/courses/"+encodeURIComponent(event.deliveryId)+"/attendanceDetail?sessionId="+encodeURIComponent(event.id):
   "/teacher/calendar",
 }));
 const tasks:FacultyTodayTask[]=[];
 // Do not claim an unread count without a persisted read cursor.
 // Show recent student messages only for the actor's currently assigned deliveries.
 const assigned=await listFacultyCourseDeliveries(context);
 const assignedIds=[...new Set(assigned.map(row=>row.deliveryId))];
 const recentMessages=assignedIds.length?await getDb().select({
  id:courseDiscussionMessages.id,
  deliveryId:courseDiscussionMessages.deliveryId,
  messageText:courseDiscussionMessages.messageText,
  createdAt:courseDiscussionMessages.createdAt,
 }).from(courseDiscussionMessages)
  .where(and(inArray(courseDiscussionMessages.deliveryId,assignedIds),
    eq(courseDiscussionMessages.senderRole,"LEARNER"),
    isNull(courseDiscussionMessages.deletedAt),
    gte(courseDiscussionMessages.createdAt,new Date(now.getTime()-24*3600*1000))))
  .orderBy(desc(courseDiscussionMessages.createdAt)).limit(30):[];

 const assignment=[...new Map(assessments.assignments
  .filter(item=>item.hasSubmissions).map(item=>[item.id+":"+item.deliveryId,item] as const)).values()][0];
 if(assignment){
  const submissions=await listAssignmentSubmissions(context,assignment.id,assignment.deliveryId)
   .catch(()=>null);
  const pending=submissions?.filter(item=>item.gradingStatus!=="GRADED")??null;
  if(pending===null||pending.length>0)tasks.push({
   id:"grade-"+assignment.id+":"+assignment.deliveryId,eyebrow:"TO GRADE",tone:"warning",
   title:pending===null?"Review "+assignment.title:
    pending.length+" "+(pending.length===1?"submission waits":"submissions wait")+" for a grade",
   detail:assignment.title+" · "+assignment.courseCode+" · "+assignment.sectionName+
    (pending===null?" · Grading count unavailable.":" · Review learner submissions."),
   action:"Grade",href:"/teacher/report/assignment/"+encodeURIComponent(assignment.id)+
    "/grade?deliveryId="+encodeURIComponent(assignment.deliveryId),
  });
 }
 if(todayEvents.length){
  const event=todayEvents.find(item=>item.deliveryId!==null)??todayEvents[0]!;
  tasks.push({
   id:"attendance-"+event.id,
   eyebrow:"TODAY, "+clock(event.startsAt),tone:"warning",
   title:"Take attendance for "+event.sectionName,
   detail:(event.location??"Room not provided")+" · "+(event.courseName??event.title)+
    ". Open the recorded class session to review or mark attendance.",
   action:"Take attendance",
   href:event.deliveryId?
    "/teacher/courses/"+encodeURIComponent(event.deliveryId)+"/attendanceDetail?sessionId="+encodeURIComponent(event.id):
    "/teacher/calendar",
  });
 }
 if(recentMessages.length){
  const recent=recentMessages[0]!;
  const clazz=assigned.find(row=>row.deliveryId===recent.deliveryId);
  const count=recentMessages.length;
  const quoted=recent.messageText.trim().replace(/\s+/g," ").slice(0,110);
  tasks.push({
   id:"discussions-"+recent.deliveryId,eyebrow:"STUDENTS ASKED",
   title:count+(count===1?" recent student message":" recent student messages")+" in Discussions",
   detail:(quoted?'“'+quoted+(recent.messageText.trim().length>110?"…":"")+'”':"A student posted in your class.")+
    (count>1?" and "+(count-1)+" more in the last 24 hours.":".")+
    (clazz?" · "+clazz.sectionName:""),
   action:"Reply",href:"/teacher/courses/"+encodeURIComponent(recent.deliveryId)+"/discussions",
  });
 }
 const quiz=[...new Map(assessments.quizzes
  .filter(item=>item.status==="DRAFT"&&item.facultyOwned)
  .map(item=>[item.id,item] as const)).values()][0];
 if(quiz)tasks.push({
  id:"quiz-"+quiz.id,eyebrow:"NOT PUBLISHED",
  title:quiz.title+" is still a draft",
  detail:quiz.courseCode+" · "+quiz.lessonName+" · Students cannot see it yet.",
  action:"Open quiz",href:"/teacher/allQuizzes?content="+encodeURIComponent(quiz.id),
 });
 const limit=now.getTime()+7*86400000;
 const future=[
  ...assessments.assignments.filter(item=>item.dueAt&&item.dueAt.getTime()>=now.getTime()&&item.dueAt.getTime()<=limit)
   .map(item=>({id:"assignment-"+item.id+":"+item.deliveryId,
    title:item.title,at:item.dueAt!,href:"/teacher/report/assignment/"+encodeURIComponent(item.id)+
     "?deliveryId="+encodeURIComponent(item.deliveryId)})),
  ...assessments.quizzes.filter(item=>item.dueAt&&item.dueAt.getTime()>=now.getTime()&&item.dueAt.getTime()<=limit)
   .map(item=>({id:"quiz-"+item.id+":"+item.deliveryId,
    title:item.title,at:item.dueAt!,href:"/teacher/report/quiz/"+encodeURIComponent(item.id)+
     "?deliveryId="+encodeURIComponent(item.deliveryId)})),
 ].sort((a,b)=>a.at.getTime()-b.at.getTime());
 const deadlines:FacultyTodayDeadline[]=[...new Map(future.map(item=>[item.id,item] as const)).values()]
  .slice(0,4).map(item=>({
   id:item.id,title:item.title,
   dateLabel:new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",weekday:"short",day:"numeric",month:"short"}).format(item.at),
   detail:"Upcoming deadline",href:item.href,
  }));
 return <FacultyTodayPanel tasks={tasks} firstName={firstName} greeting={greeting}
  dateLabel={dateLabel} nextClass={nextClass} dailyClasses={dailyClasses} deadlines={deadlines}/>;
}
