import Link from "next/link";
import {facultyReportCsvHref} from "@/modules/courses/faculty-report-csv-request";
import type {getFacultyAssignmentReport} from "@/modules/courses/faculty-assessment-report-service";

type Report=Awaited<ReturnType<typeof getFacultyAssignmentReport>>;
const istDay=(date:Date)=>new Intl.DateTimeFormat("en-CA",{
 timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
}).format(date);
const dayLabel=(date:Date)=>new Intl.DateTimeFormat("en-IN",{
 timeZone:"Asia/Kolkata",weekday:"short",day:"numeric",month:"short",
}).format(date);
const shortDay=(date:Date)=>new Intl.DateTimeFormat("en-IN",{
 timeZone:"Asia/Kolkata",day:"numeric",month:"short",
}).format(date);

/** Faculty prototype #11: Section-scoped, persisted assessment statistics.
 * Never infer unsubmitted students when the authorized roster read failed.
 * Counts use the same grader, roster and due-instant rules as the detailed report. */
export function FacultyPrototypeAssignmentReport({report}:{report:Report}){
 const {assignment,metrics,distribution,submissions,missingLearners}=report;
 const eligible=metrics.eligibleLearners;
 const dueDay=assignment.dueAt?istDay(assignment.dueAt):null;
 const lastDay=dueDay===null?0:submissions.filter(item=>
   item.submittedAt.getTime()<=assignment.dueAt!.getTime()&&
   istDay(item.submittedAt)===dueDay).length;
 const values=[
  {label:"Handed in",value:report.rosterUnavailable?
    String(metrics.submitted):metrics.submitted+" of "+eligible},
  {label:"Graded",value:String(metrics.graded)},
  {label:"Average",value:metrics.averagePercent===null?"—":metrics.averagePercent+"%"},
  {label:"Due",value:assignment.dueAt?dayLabel(assignment.dueAt):"Not set"},
 ];
 const max=Math.max(1,...distribution.map(bucket=>bucket.count));
 const gradeHref="/teacher/report/assignment/"+encodeURIComponent(assignment.id)+"/grade?deliveryId="+
  encodeURIComponent(assignment.deliveryId);
 const csvHref=facultyReportCsvHref({
  kind:"assignment",assessmentId:assignment.id,deliveryId:assignment.deliveryId,
 });
 const summary=[
  {label:dueDay?"Before the last day":"On time",value:metrics.onTime-lastDay},
  ...(dueDay?[{label:"Last day",value:lastDay}]:[]),
  {label:"Late",value:metrics.late},
  {label:"Not handed in",value:metrics.missing??"—"},
 ];
 return <section aria-label="Faculty prototype assignment report" className="space-y-4">
  <Link className="faculty-proto-link" href="/teacher/assessments">‹ Assignments &amp; quizzes</Link>
  <header className="flex flex-wrap items-end justify-between gap-3">
   <div><h1 className="faculty-proto-heading">{assignment.title?.trim()||"Untitled assignment"}</h1>
    <p className="faculty-proto-subtitle mt-1">{assignment.courseCode} · {assignment.sectionName} · {assignment.dueAt?
      "due "+dayLabel(assignment.dueAt):"No due date"}</p>
   </div>
   <nav aria-label="Assessment report type" className="flex flex-wrap gap-2">
    <span className="faculty-proto-pill !border-[#078191] !bg-[#eef8f9] !text-[#078191]" aria-current="page">
      Assignment report</span>
    <Link className="faculty-proto-pill no-underline" href="/teacher/allQuizzes">Quiz report</Link>
   </nav>
  </header>
  <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{values.map(item=><div key={item.label}
   className="rounded-xl border border-[#e5ebf2] px-[18px] py-4">
   <dt className="faculty-proto-subtitle">{item.label}</dt>
   <dd className="mt-1 text-2xl font-extrabold text-[#1d293f] tabular-nums">{item.value}</dd>
  </div>)}</dl>
  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
   <section className="rounded-xl border border-[#e5ebf2] px-[18px] py-5">
    <h2 className="text-xs font-bold uppercase tracking-wide text-[#60718b]">Score distribution</h2>
    {metrics.graded? <div className="mt-4 flex min-h-[158px] items-end gap-2" role="img"
     aria-label={distribution.map(bucket=>bucket.label+": "+bucket.count).join(", ")}>
     {[...distribution].reverse().map(bucket=><div className="flex min-w-0 flex-1 flex-col items-center"
      key={bucket.label}>
      <strong className="text-xs font-semibold tabular-nums">{bucket.count}</strong>
      <div className="mt-1 w-full rounded-t bg-[#08818f]"
       style={{height:Math.max(bucket.count?7:1,136*bucket.count/max)}}/>
      <span className="mt-1 text-center text-xs text-[#60718b]">{bucket.label}</span>
     </div>)}
    </div>:<p className="faculty-proto-subtitle mt-5">No graded submissions yet.</p>}
   </section>
   <section className="rounded-xl border border-[#e5ebf2] px-[18px] py-5">
    <h2 className="text-xs font-bold uppercase tracking-wide text-[#60718b]">When they handed in</h2>
    <dl className="mt-2 divide-y divide-[#edf1f5]">{summary.map(item=><div key={item.label}
     className="flex items-center justify-between py-3 text-sm">
     <dt className="text-[#243149]">{item.label}</dt>
     <dd className={"font-semibold tabular-nums "+(item.label==="Late"&&item.value!==0?
       "text-red-700":"text-[#1d293f]")}>{item.value}</dd>
    </div>)}</dl>
    {report.rosterUnavailable?<p className="faculty-proto-subtitle">The roster is unavailable; missing counts cannot be calculated.</p>:null}
   </section>
  </div>
  <section className="overflow-hidden rounded-xl border border-[#e5ebf2]">
   <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5ebf2] px-[18px] py-4">
    <h2 className="text-xs font-bold uppercase tracking-wide text-[#60718b]">Student scores</h2>
    <Link className="faculty-proto-secondary !min-h-9 !px-3 !py-1.5 !text-xs"
     href={csvHref}>Download as spreadsheet</Link>
   </header>
   <div className="faculty-proto-table-wrap">
    <table className="faculty-proto-table !rounded-none !border-0">
     <thead><tr><th>Student</th><th>Score</th><th>Handed in</th><th><span className="sr-only">Actions</span></th></tr></thead>
     <tbody>{submissions.map(item=>{
      const graded=item.gradingStatus==="GRADED"&&item.pointsAwarded!==null;
      const href=gradeHref+"&student="+encodeURIComponent(item.id);
      return <tr key={item.id}>
       <td>{item.learnerDisplayName?.trim()||"Student"}</td>
       <td>{graded?<span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">
        {item.pointsAwarded} / {assignment.maxPoints}</span>:
        <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-700">To grade</span>}</td>
       <td>{dayLabel(item.submittedAt)}</td>
       <td className="text-right"><Link className={(graded?"faculty-proto-secondary":"faculty-proto-action")+
        " !min-h-9 !px-3 !py-1.5 !text-xs"} href={href}>{graded?"Open":"Grade"}</Link></td>
      </tr>;
     })}
     {!report.rosterUnavailable?missingLearners.map(student=><tr key={"missing-"+student.membershipId}>
      <td>{student.displayName?.trim()||"Student"}</td>
      <td><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-[#60718b]">Missing</span></td>
      <td>—</td>
      <td className="text-right"><Link className="faculty-proto-secondary !min-h-9 !px-3 !py-1.5 !text-xs"
       href={"/teacher/courses/"+encodeURIComponent(assignment.deliveryId)+"/students/"+
        encodeURIComponent(student.membershipId)}>View student</Link></td>
     </tr>):null}
     </tbody>
    </table>
   </div>
   {!submissions.length&&!missingLearners.length?<p className="faculty-proto-subtitle p-5">
    {report.rosterUnavailable?"No known submissions. The roster could not be verified.":"No submissions yet."}</p>:null}
  </section>
  <p className="sr-only">Grading is restricted to this authorized Section. Scores remain private to learners until published.</p>
 </section>;
}
