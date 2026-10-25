import Link from "next/link";
import type {getFacultyCourseHomeSignals} from "@/modules/courses/faculty-course-home-service";
import type {getFacultyCourseWorkspace} from "@/modules/courses/faculty-course-service";
import type {CourseDisplayContentView} from "@/modules/courses/course-display-service";

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
  id:"quiz",title:quiz.title+" closes "+
   new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",weekday:"long"}).format(quiz.dueAt),
  detail:"Students can attempt this quiz until its published deadline.",
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
 if(signals?.completeness.attendance)priorities.push({
  id:"attendance",title:"Review attendance for "+course.sectionName,
  detail:signals.attendance.markedSessions+" class "+
   (signals.attendance.markedSessions===1?"session recorded":"sessions recorded")+
   " · Mark any outstanding class session.",
  href:base+"/attendanceDetail",action:"Take it",
 });
 priorities.push({
  id:"discussions",title:"Questions in Discussions",
  detail:"Read and reply to student questions in this class.",
  href:base+"/discussions",action:"Reply",
 });
 const total=summary.contents+summary.assignments+summary.quizzes;
 const publicationPercent=total>0?Math.round(summary.publishedItems/total*100):null;
 const attendance=signals?.completeness.attendance?signals.attendance.averagePercent:null;
 const gradeAverage=signals?.completeness.assignments?signals.performance.averagePercent:null;
 const risk=signals?.completeness.attendance&&signals.completeness.assignments?signals.atRiskTotal:null;
 const rows=[
  {label:"Content published",value:publicationPercent===null?"—":publicationPercent+"%",href:base+"/blueprint"},
  {label:"Attendance (marked classes)",value:attendance===null?"—":attendance+"%",href:base+"/attendanceDetail"},
  {label:"Graded work average",value:gradeAverage===null?"—":gradeAverage+"%",href:base+"/reports"},
  {label:"Students needing attention",value:risk===null?"—":String(risk),href:base+"/students"},
 ];
 const description=display?.introductionText?.trim()||course.courseDescription?.trim()||null;
 return <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_308px]">
  <section aria-label="Needs you" className="faculty-proto-task-list min-w-0">
   <h2 className="border-b border-[#e5ebf2] px-5 py-4 text-xs font-bold uppercase tracking-wide text-[#60718b]">
    Needs you · {course.sectionName}
   </h2>
   {priorities.map(item=><article key={item.id}
     className="flex min-h-[67px] flex-wrap items-center justify-between gap-4 border-b border-[#edf1f5] px-5 py-4 last:border-b-0">
    <div className="min-w-0 flex-1">
     <h3 className="text-sm font-bold leading-5 text-[#1d293f]">{item.title}</h3>
     <p className="faculty-proto-subtitle">{item.detail}</p>
    </div>
    <Link className={(item.urgent||item.id==="attendance"?"faculty-proto-action":"faculty-proto-secondary")+" shrink-0"}
     href={item.href}>{item.action}</Link>
   </article>)}
   {!signals?<p role="status" className="px-5 py-3 text-xs text-[#60718b]">
    The latest class indicators are unavailable. Open the relevant section tool to retry.
   </p>:null}
  </section>
  <aside aria-label="Course summary" className="min-w-0 space-y-4">
   <section className="rounded-xl border border-[#e5ebf2] p-5">
    <div className="flex items-center justify-between gap-2">
     <h2 className="text-xs font-bold uppercase tracking-wide text-[#60718b]">About this course</h2>
     <Link href={base+"/home?advanced=1#course-details"}
      className="faculty-proto-secondary !min-h-9 !px-3 !py-1.5 text-xs">Details</Link>
    </div>
    <h3 className="mt-3 text-sm font-bold text-[#1d293f]">{course.courseName}</h3>
    <p className="faculty-proto-subtitle line-clamp-3">{description??"No course description has been provided."}</p>
    <p className="faculty-proto-subtitle mt-2">{summary.lessons} lessons · {course.credits===null?"Credits not set":course.credits+" credits"} · {course.academicPeriodName}</p>
   </section>
   <section className="rounded-xl border border-[#e5ebf2] px-5 py-4">
    <h2 className="text-xs font-bold uppercase tracking-wide text-[#60718b]">How the class is doing</h2>
    <dl className="mt-2 divide-y divide-[#edf1f5]">
     {rows.map(row=><div key={row.label} className="flex items-center justify-between gap-3 py-3 text-sm">
      <dt className="min-w-0 text-[#1d293f]">{row.label}</dt>
      <dd><Link className="font-bold text-[#243149] hover:text-[#078191] hover:underline"
       href={row.href}>{row.value}</Link></dd>
     </div>)}
    </dl>
    <p className="mt-2 text-xs leading-5 text-[#60718b]">
     Content percentage is publication progress, not learner completion. Grade averages use only graded assignments; unavailable values are shown as dashes.
    </p>
   </section>
  </aside>
 </div>;
}
