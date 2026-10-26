import {getCurrentRequestContext} from "@/auth/request-context";
import {getFacultyAssessmentOverview} from "@/modules/courses/faculty-assessment-service";
import {getFacultyClassSchedule} from "@/modules/courses/faculty-schedule-service";
import {getDb} from "@/db/client";
import {assignmentSubmissions,attendanceSessions,courseDiscussionMessages,colleges} from "@/db/schema";
import {listFacultyCourseDeliveries} from "@/modules/courses/faculty-course-service";
import {users} from "@/db/schema";
import {and,desc,eq,gte,inArray,isNull,sql} from "drizzle-orm";
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
 const collegeCode=context.membership?.collegeId?
  await getDb().select({code:colleges.code}).from(colleges)
   .where(eq(colleges.id,context.membership.collegeId)).limit(1)
   .then(rows=>rows[0]?.code?.trim()??""): "";
 const dateLabel=new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",weekday:"long",day:"numeric",month:"long",
 }).format(now)+(collegeCode?" · "+collegeCode:"");
 const hour=Number(new Intl.DateTimeFormat("en-GB",{
  timeZone:"Asia/Kolkata",hour:"2-digit",hourCycle:"h23",
 }).format(now));
 const greeting=hour<12?"morning":hour<17?"afternoon":"evening";
 const upcoming=schedule?.nextUpcoming??null;
 const minutesToClass=upcoming?Math.max(0,Math.ceil((upcoming.startsAt.getTime()-now.getTime())/60000)):0;
 const when=minutesToClass<24*60?
  "in "+(minutesToClass>=60?Math.floor(minutesToClass/60)+" "+(Math.floor(minutesToClass/60)===1?"hour":"hours"):"")+
   (minutesToClass>=60&&minutesToClass%60>0?" ":"")+
   (minutesToClass%60>0||minutesToClass===0?minutesToClass%60+" "+(minutesToClass%60===1?"minute":"minutes"):""):
  "on "+new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",weekday:"short",day:"numeric",month:"short",hour:"numeric",minute:"2-digit",hour12:true}).format(upcoming!.startsAt);
 const nextClass=upcoming?
  "Next class "+when+": "+(upcoming.courseName??upcoming.title??"Scheduled class")+
  ", "+upcoming.sectionName+(upcoming.location?", "+upcoming.location:"")+".":null;
 const todayKey=dateKey(now);
 const todayEvents=[...new Map((schedule?.events??[])
  .filter(event=>dateKey(event.startsAt)===todayKey)
  .map(event=>[event.id,event] as const)).values()];
 const eventIds=[...new Set(todayEvents.map(event=>event.id))];
 const markedRead=eventIds.length?await getDb().select({
  id:attendanceSessions.scheduleEventId,
  status:attendanceSessions.status,
 }).from(attendanceSessions)
  .where(inArray(attendanceSessions.scheduleEventId,eventIds))
  .catch(()=>null):[];
 const markedIds=markedRead===null?null:
  new Set(markedRead.filter(item=>item.status==="MARKED").map(item=>item.id));
 const dailyClasses:FacultyTodayClass[]=todayEvents.slice(0,5).map(event=>({
  id:event.id,title:event.courseCode??event.title,sectionName:event.sectionName,
  timeLabel:clock(event.startsAt),location:event.location,learnerCount:null,
  actionLabel:markedIds?.has(event.id)?"Review attendance":"Take attendance",
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

 const assignmentIds=[...new Set(assessments.assignments.map(item=>item.id))];
 const deliveryIds=[...new Set(assessments.assignments.map(item=>item.deliveryId))];
 const pendingRead=assignmentIds.length&&deliveryIds.length?
  await getDb().select({
   id:assignmentSubmissions.assignmentId,
   deliveryId:assignmentSubmissions.deliveryId,
   pending:sql<number>`count(*) filter (where ${assignmentSubmissions.gradingStatus} <> 'GRADED')::int`,
  }).from(assignmentSubmissions).where(and(
   inArray(assignmentSubmissions.assignmentId,assignmentIds),
   inArray(assignmentSubmissions.deliveryId,deliveryIds),
  )).groupBy(assignmentSubmissions.assignmentId,assignmentSubmissions.deliveryId)
  .catch(()=>null):[];
 const pendingByAssignment=new Map(pendingRead?.map(item=>[
  item.id+":"+item.deliveryId,item.pending] as const)??[]);
 const assignment=[...new Map(assessments.assignments
  .filter(item=>item.status==="PUBLISHED"&&(pendingRead===null?
   item.hasSubmissions:(pendingByAssignment.get(item.id+":"+item.deliveryId)??0)>0))
  .map(item=>[item.id+":"+item.deliveryId,item] as const)).values()]
  .sort((a,b)=>(pendingByAssignment.get(b.id+":"+b.deliveryId)??0)-
   (pendingByAssignment.get(a.id+":"+a.deliveryId)??0))[0];
 if(assignment){
  const pending=pendingRead===null?null:pendingByAssignment.get(assignment.id+":"+assignment.deliveryId)??0;
  if(pending===null||pending>0)tasks.push({
   id:"grade-"+assignment.id+":"+assignment.deliveryId,eyebrow:"TO GRADE",tone:"warning",
   title:pending===null?"Review "+assignment.title:
    pending+" "+(pending===1?"submission waits":"submissions wait")+" for a grade",
   detail:assignment.title+" · "+assignment.courseCode+" · "+assignment.sectionName+
    (pending===null?" · Grading count unavailable.":" · Review learner submissions."),
   action:"Grade",href:"/teacher/report/assignment/"+encodeURIComponent(assignment.id)+
    "/grade?deliveryId="+encodeURIComponent(assignment.deliveryId),
  });
 }
 const unmarkedEvent=todayEvents.find(item=>item.deliveryId!==null&&
  (markedIds===null||!markedIds.has(item.id)));
 if(unmarkedEvent){
  const event=unmarkedEvent;
  tasks.push({
   id:"attendance-"+event.id,
   eyebrow:"TODAY, "+clock(event.startsAt),tone:"warning",
   title:"Take attendance for "+event.sectionName,
   detail:(event.location??"Room not provided")+" · "+(event.courseName??event.title)+
    ". Open the class session to record attendance.",
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
