import Link from "next/link";
import type {getFacultyCourseHomeSignals} from "@/modules/courses/faculty-course-home-service";
import type {getFacultyCourseWorkspace} from "@/modules/courses/faculty-course-service";

type Signals=Awaited<ReturnType<typeof getFacultyCourseHomeSignals>>|null;
type Workspace=Awaited<ReturnType<typeof getFacultyCourseWorkspace>>;

export function FacultyPrototypeCoursePriorities({signals,workspace}:{
 signals:Signals;workspace:Workspace;
}){
 const deliveryId=workspace.course.deliveryId;
 const first=signals?.pendingSubmissions[0];
 const draftQuiz=workspace.lessons.flatMap(lesson=>lesson.quizzes)
  .find(quiz=>quiz.status==="DRAFT"&&quiz.deliveryId===deliveryId);
 const priorities:[
  string,string,string,string
 ][]=[];
 if(signals?.completeness.assignments&&first){
  priorities.push(["TO GRADE",
   signals.pendingSubmissions.length+" submissions to grade",
   first.assignmentTitle+" · Pending learner work",
   "/teacher/report/assignment/"+encodeURIComponent(first.assignmentId)+
   "?deliveryId="+encodeURIComponent(deliveryId)]);
 }
 if(draftQuiz)priorities.push([
  "NOT PUBLISHED",draftQuiz.title+" is still a draft",
  "Students cannot see this quiz until it is published.",
  "/teacher/courses/"+encodeURIComponent(deliveryId)+"/quizzes",
 ]);
 if(signals?.completeness.attendance)priorities.push([
  "ATTENDANCE","Review attendance for "+workspace.course.sectionName,
  signals.attendance.markedSessions+" marked class sessions",
  "/teacher/courses/"+encodeURIComponent(deliveryId)+"/attendanceDetail",
 ]);
 priorities.push([
  "DISCUSSIONS","Questions and discussion threads",
  "Open course conversations and reply to students.",
  "/teacher/courses/"+encodeURIComponent(deliveryId)+"/discussions",
 ]);
 return <section aria-label="Needs you" className="faculty-proto-task-list">
  <h2 className="border-b border-[#e5ebf2] px-5 py-4 text-xs font-bold uppercase tracking-wide text-[#60718b]">
   Needs you · {workspace.course.sectionName}
  </h2>
  {priorities.map(([tag,title,detail,href])=><div className="faculty-proto-task" key={tag}>
   <div className="min-w-0">
    <p className="faculty-proto-task-label">{tag}</p>
    <h3 className="mt-1 text-base font-bold text-[#1d293f]">{title}</h3>
    <p className="faculty-proto-subtitle">{detail}</p>
   </div>
   <Link href={href} className="faculty-proto-action shrink-0">
    {tag==="TO GRADE"?"Grade":tag==="ATTENDANCE"?"Take attendance":tag==="DISCUSSIONS"?"Reply":"Open quiz"}
   </Link>
  </div>)}
  {!signals?.completeness.assignments||!signals?.completeness.attendance?
    <p role="status" className="px-5 py-3 text-xs text-[#60718b]">
     Some priority counts are unavailable. Use course tools for the full teaching view.
    </p>:null}
 </section>;
}
