import {and,inArray,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {assignmentSubmissions,quizAttempts} from "@/db/schema";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getFacultyAssessmentOverview} from "@/modules/courses/faculty-assessment-service";
import {getFacultyDeliveryRoster} from "@/modules/attendance/faculty-service";
import {FacultyPrototypeAssessmentDirectory,type AssessmentRow} from
 "@/components/courses/faculty-prototype-assessment-directory";

export default async function FacultyAssessmentsPage({searchParams}:{
 searchParams:Promise<{kind?:string|string[]}>;
}){
 // Preserve a shareable, non-sensitive destination for the two legacy list
 // experiences without retiring their advanced actions prematurely.
 const requestedKind=(await searchParams).kind;
 const initialKind=requestedKind==="assignment"||requestedKind==="quiz"
  ?requestedKind:"all";
 const context=await getCurrentRequestContext();
 const overview=await getFacultyAssessmentOverview(context);
 const ids=[...new Set(overview.assignments.map(item=>item.id))];
 const quizIds=[...new Set(overview.quizzes.map(item=>item.id))];
 const deliveryIds=[...new Set([...overview.assignments,...overview.quizzes].map(item=>item.deliveryId))];
 const [assignmentCounts,quizCounts,rosters]=await Promise.all([
  ids.length&&deliveryIds.length?getDb().select({
   id:assignmentSubmissions.assignmentId,deliveryId:assignmentSubmissions.deliveryId,
   handedIn:sql<number>`count(distinct ${assignmentSubmissions.membershipId})::int`,
   pending:sql<number>`count(*) filter (where ${assignmentSubmissions.gradingStatus} <> 'GRADED')::int`,
  }).from(assignmentSubmissions).where(and(
   inArray(assignmentSubmissions.assignmentId,ids),
   inArray(assignmentSubmissions.deliveryId,deliveryIds),
  )).groupBy(assignmentSubmissions.assignmentId,assignmentSubmissions.deliveryId):[],
  quizIds.length&&deliveryIds.length?getDb().select({
   id:quizAttempts.quizId,deliveryId:quizAttempts.deliveryId,
   handedIn:sql<number>`count(distinct ${quizAttempts.membershipId})::int`,
  }).from(quizAttempts).where(and(
   inArray(quizAttempts.quizId,quizIds),
   inArray(quizAttempts.deliveryId,deliveryIds),
   sql`${quizAttempts.deletedAt} is null`,
  )).groupBy(quizAttempts.quizId,quizAttempts.deliveryId):[],
  Promise.all(deliveryIds.map(async deliveryId=>({
   deliveryId,count:await getFacultyDeliveryRoster(context,deliveryId)
    .then(value=>value.roster.length).catch(()=>null),
  }))),
 ]);
 const submissions=new Map(assignmentCounts.map(row=>[row.id+":"+row.deliveryId,row] as const));
 const attempts=new Map(quizCounts.map(row=>[row.id+":"+row.deliveryId,row] as const));
 const rosterSizes=new Map(rosters.map(row=>[row.deliveryId,row.count] as const));
 const rows:AssessmentRow[]=[
  ...overview.assignments.map(item=>{
   const suffix="?deliveryId="+encodeURIComponent(item.deliveryId);
   const reportHref="/teacher/report/assignment/"+encodeURIComponent(item.id)+suffix;
   const count=submissions.get(item.id+":"+item.deliveryId);
   return {
    key:"assignment-"+item.id+":"+item.deliveryId,kind:"Assignment" as const,
    deliveryId:item.deliveryId,
    title:item.title,courseCode:item.courseCode,sectionName:item.sectionName,
    dueAt:item.dueAt?.toISOString()??null,status:item.status,
    handedIn:count?.handedIn??0,eligible:rosterSizes.get(item.deliveryId)??null,
    toGrade:count?.pending??0,reportHref,
    primaryHref:"/teacher/report/assignment/"+encodeURIComponent(item.id)+"/grade"+suffix,
    editorHref:"/teacher/courses/"+encodeURIComponent(item.deliveryId)+"/blueprint?lesson="+
     encodeURIComponent(item.lessonId)+"&content="+encodeURIComponent(item.id)+
     "&advanced=1#course-item-"+encodeURIComponent(item.id),
   };
  }),
  ...overview.quizzes.map(item=>{
   const suffix="?deliveryId="+encodeURIComponent(item.deliveryId);
   const reportHref="/teacher/report/quiz/"+encodeURIComponent(item.id)+suffix;
   return {
    key:"quiz-"+item.id+":"+item.deliveryId,kind:"Quiz" as const,
    deliveryId:item.deliveryId,
    title:item.title,courseCode:item.courseCode,sectionName:item.sectionName,
    dueAt:item.dueAt?.toISOString()??null,status:item.status,
    handedIn:attempts.get(item.id+":"+item.deliveryId)?.handedIn??0,
    eligible:rosterSizes.get(item.deliveryId)??null,toGrade:null,reportHref,
    primaryHref:reportHref,editorHref:"/teacher/allQuizzes?content="+encodeURIComponent(item.id),
   };
  }),
 ].sort((a,b)=>(a.dueAt?Date.parse(a.dueAt):0)-(b.dueAt?Date.parse(b.dueAt):0));
 return <FacultyPrototypeAssessmentDirectory rows={rows} lessonChoices={overview.lessonChoices} initialKind={initialKind}/>;
}
