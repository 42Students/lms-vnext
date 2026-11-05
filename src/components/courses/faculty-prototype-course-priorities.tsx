import type {getFacultyCourseHomeSignals} from "@/modules/courses/faculty-course-home-service";
import type {getFacultyCourseWorkspace} from "@/modules/courses/faculty-course-service";
import type {CourseDisplayContentView} from "@/modules/courses/course-display-service";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";
import { createDateFormatter } from "@/lib/format-date";

type Signals=Awaited<ReturnType<typeof getFacultyCourseHomeSignals>>|null;
type Workspace=Awaited<ReturnType<typeof getFacultyCourseWorkspace>>;
type Priority={id:string;title:string;detail:string;href:string;action:string;urgent?:boolean};
export function FacultyPrototypeCoursePriorities({signals,workspace,display}:{
 signals:Signals;workspace:Workspace;display:CourseDisplayContentView|null;
}){
 const {course,summary,lessons}=workspace;
 const base="/teacher/courses/"+encodeURIComponent(course.deliveryId);
 const pending=signals?.completeness.assignments?signals.pendingSubmissions:null;
 const pendingFirst=pending?.[0]??null;
 const draft=lessons.flatMap(lesson=>lesson.quizzes)
  .find(item=>item.status==="DRAFT"&&(item.deliveryId===null||item.deliveryId===course.deliveryId));
 const quiz=lessons.flatMap(lesson=>lesson.quizzes)
  .filter(item=>item.status==="PUBLISHED"&&item.dueAt&&item.dueAt.getTime()>Date.now())
  .sort((a,b)=>(a.dueAt?.getTime()??0)-(b.dueAt?.getTime()??0))[0];
 const priorities:Priority[]=[];
 if(pendingFirst)priorities.push({
  id:"grade",title:pending!.length+" submissions to grade",
  detail:pendingFirst.assignmentTitle+" · "+course.sectionName,
  href:"/teacher/report/assignment/"+encodeURIComponent(pendingFirst.assignmentId)+
   "/grade?deliveryId="+encodeURIComponent(course.deliveryId),
  action:"Grade",urgent:true,
 });
 if(quiz?.dueAt)priorities.push({
  id:"quiz",title:quiz.title+" due "+
   createDateFormatter("en-IN", {timeZone:"Asia/Kolkata",weekday:"long"}).format(quiz.dueAt),
  detail:(()=>{
   const attempted=signals?.courseCompletion?.quizAttemptsById.find(item=>item.quizId===quiz.id)?.attempted;
   const roster=signals?.studentRosterMetrics.byLearner.length;
   return attempted!==undefined&&roster!==undefined?
    attempted+" of "+roster+" have taken it.":"Students can attempt this quiz until its published deadline.";
  })(),
  href:"/teacher/report/quiz/"+encodeURIComponent(quiz.id)+
   "?deliveryId="+encodeURIComponent(course.deliveryId),
  action:"See who is left",
 });
 else if(draft)priorities.push({
  id:"quiz",title:draft.title+" is not published",
  detail:"This quiz is still a draft; students cannot see it.",
  href:base+"/blueprint?lesson="+encodeURIComponent(draft.lessonId)+"&content="+encodeURIComponent(draft.id)+"&advanced=1",
  action:"Open quiz",
 });
 if(signals?.overviewActivity.todayUnmarkedSession){
  const event=signals.overviewActivity.todayUnmarkedSession;
  priorities.push({
   id:"attendance",title:"Attendance for today not taken",
   detail:"Class at "+createDateFormatter("en-IN", {
    timeZone:"Asia/Kolkata",hour:"numeric",minute:"2-digit",
   }).format(new Date(event.startsAt))+" · "+(event.location??course.sectionName),
   href:base+"/attendanceDetail?sessionId="+encodeURIComponent(event.id),action:"Take it",
  });
 }else if(signals?.completeness.attendance)priorities.push({
  id:"attendance",title:"Review class attendance",
  detail:signals.attendance.markedSessions+" class sessions recorded.",
  href:base+"/attendanceDetail",action:"Review",
 });
 const messages=signals?.overviewActivity.studentMessagesLast7Days??null;
 priorities.push({
  id:"discussions",
  title:messages===null?"Discussions":messages===0?"Check Discussions":
   messages+" student "+(messages===1?"message":"messages")+" in the last 7 days",
  detail:messages===null?"Open your class messages.":
   messages===0?"No student messages were posted in the last 7 days.":
   "Read and reply to recent student messages in this class.",
  href:base+"/discussions",action:"Reply",
 });

 const attendance=signals?.completeness.attendance?signals.overviewActivity.attendanceThisMonthPercent:null;
 const courseProgress=signals?.courseCompletion?.averagePercent??null;
 const quizAverage=signals?.courseCompletion?.quizAveragePercent??null;
 const behind=signals?.courseCompletion?.behindTotal??null;
 const rows=[
  {label:"Course progress (average)",value:courseProgress===null?"—":courseProgress+"%",href:base+"/students"},
  {label:"Attendance this month",value:attendance===null?"—":attendance+"%",href:base+"/attendanceDetail"},
  {label:"Quiz average",value:quizAverage===null?"—":quizAverage+"%",href:base+"/reports"},
  {label:"Behind (under 30% progress)",value:behind===null?"—":String(behind)+" students",href:base+"/students"},
 ];
 const description=display?.introductionText?.trim()||course.courseDescription?.trim()||null;
 return <div className="grid min-w-0 items-start gap-[20px] xl:grid-cols-[minmax(0,1fr)_307px]">
  <section aria-label="Needs you" className="faculty-proto-task-list min-w-0">
   <Heading level={2} size="xs" className="border-b border-[color:var(--lms-border)] px-5 py-4 uppercase tracking-wide text-[color:var(--lms-text-muted)]">
    Needs you · <span>{course.sectionName}</span>
   </Heading>
   {priorities.map(item=><article key={item.id}
     className="flex min-h-[68px] flex-wrap items-center justify-between gap-4 border-b border-[color:var(--lms-neutral-100)] px-5 py-4 last:border-b-0">
    <div className="min-w-0 flex-1">
     <Heading level={3} size="sm" className="leading-5 text-[color:var(--lms-heading)]">{item.title}</Heading>
     <p className="faculty-proto-subtitle">{item.detail}</p>
    </div>
    <TextLink variant="bare" className={(item.urgent||item.id==="attendance"?"faculty-proto-action":"faculty-proto-secondary")+" shrink-0"}
     href={item.href}>{item.action}</TextLink>
   </article>)}
   {!signals?<p role="status" className="px-5 py-3 text-xs text-[color:var(--lms-text-muted)]">
    The latest class indicators are unavailable. Open the relevant section tool to retry.
   </p>:null}
  </section>
  <aside aria-label="Course summary" className="grid min-w-0 gap-4">
   <section className="rounded-xl border border-[color:var(--lms-border)] p-5">
    <div className="flex items-center justify-between gap-2">
     <Heading level={2} size="xs" className="uppercase tracking-wide text-[color:var(--lms-text-muted)]">About this course</Heading>
     <TextLink variant="bare" href={base+"/home?advanced=1#course-details"}
      className="faculty-proto-secondary text-xs min-h-9 px-3 py-1.5">Details</TextLink>
    </div>
    <Heading level={3} size="sm" className="mt-3 text-[color:var(--lms-heading)]">{course.courseName}</Heading>
    <p className="faculty-proto-subtitle line-clamp-3">{description??"No course description has been provided."}</p>
    <p className="faculty-proto-subtitle mt-2">{summary.lessons} lessons · {course.credits===null?"Credits not set":course.credits+" credits"} · {course.academicPeriodName}</p>
   </section>
   <section className="rounded-xl border border-[color:var(--lms-border)] px-5 py-4">
    <Heading level={2} size="xs" className="uppercase tracking-wide text-[color:var(--lms-text-muted)]">How the class is doing</Heading>
    <dl className="mt-2 divide-y divide-[color:var(--lms-neutral-100)]">
     {rows.map(row=><div key={row.label} className="flex items-center justify-between gap-3 py-3 text-sm">
      <dt className="min-w-0 text-[color:var(--lms-heading)]">{row.label}</dt>
      <dd><TextLink className="text-[color:var(--lms-text-body)]"
       href={row.href}>{row.value}</TextLink></dd>
     </div>)}
    </dl>
    <p className="mt-2 text-xs leading-5 text-[color:var(--lms-text-muted)]">
     Progress measures published videos, assignments and quizzes, using the current attempt where relevant. Quiz averages use real submitted scores; unavailable values stay unknown.
    </p>
   </section>
  </aside>
 </div>;
}
