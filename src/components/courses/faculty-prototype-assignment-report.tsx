import Link from "next/link";
import type {getFacultyAssignmentReport} from "@/modules/courses/faculty-assessment-report-service";
type Report=Awaited<ReturnType<typeof getFacultyAssignmentReport>>;
export function FacultyPrototypeAssignmentReport({report}:{
 report:Report;
}){
 const {assignment,metrics,distribution,submissions}=report;
 const values=[
  {label:"Handed in",value:report.rosterUnavailable?String(metrics.submitted):metrics.submitted+" of "+(metrics.eligibleLearners??"—")},
  {label:"Graded",value:String(metrics.graded)},
  {label:"Average",value:metrics.averagePercent===null?"—":metrics.averagePercent+"%"},
 ];
 const max=Math.max(1,...distribution.map(x=>x.count));
 const fmt=(when:Date)=>new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",day:"numeric",month:"short",year:"numeric"
 }).format(when);
 const gradeHref="/teacher/report/assignment/"+encodeURIComponent(assignment.id)+"/grade?deliveryId="+encodeURIComponent(assignment.deliveryId);
 return <section aria-label="Faculty prototype assignment report" className="space-y-5">
  <Link className="faculty-proto-link" href="/teacher/assessments">‹ Assignments & quizzes</Link>
  <div><h1 className="faculty-proto-heading">{assignment.title?.trim()||"Untitled assignment"}</h1>
   <p className="faculty-proto-subtitle mt-1">{assignment.courseCode} · {assignment.sectionName} · {assignment.dueAt?"due "+fmt(assignment.dueAt):"No due date"}</p></div>
  <div className="grid gap-3 md:grid-cols-3">{values.map(item=><div key={item.label} className="rounded-xl border border-[#e5ebf2] px-5 py-5">
   <p className="faculty-proto-subtitle">{item.label}</p><strong className="mt-1 block text-3xl font-extrabold text-[#1d293f] tabular-nums">{item.value}</strong>
  </div>)}</div>
  <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
   <section className="rounded-xl border border-[#e5ebf2] p-5">
    <h2 className="text-xs font-bold uppercase tracking-wide text-[#60718b]">Score distribution</h2>
    {metrics.graded? <div className="mt-5 flex min-h-52 items-end gap-3" role="img"
     aria-label={distribution.map(x=>x.label+": "+x.count).join(", ")}>
     {distribution.map(bucket=><div className="flex min-w-0 flex-1 flex-col items-center" key={bucket.label}>
      <strong className="text-xs tabular-nums">{bucket.count}</strong>
      <div className="mt-2 w-full rounded-t bg-[#08818f]" style={{height:Math.max(bucket.count?7:1,170*bucket.count/max)}}/>
      <span className="mt-2 text-center text-xs text-[#60718b]">{bucket.label}</span>
     </div>)}</div>:
     <p className="faculty-proto-subtitle mt-5">No graded submissions yet.</p>}
   </section>
   <section className="rounded-xl border border-[#e5ebf2] p-5">
    <h2 className="text-xs font-bold uppercase tracking-wide text-[#60718b]">When they handed in</h2>
    <dl className="mt-3 divide-y divide-[#e5ebf2]">
     {[
      ["On time",metrics.onTime],["Late",metrics.late],
      ["Not handed in",metrics.missing===null?"—":metrics.missing],
     ].map(([label,value])=><div key={label} className="flex items-center justify-between py-3 text-sm">
       <dt>{label}</dt><dd className="font-bold tabular-nums">{value}</dd>
      </div>)}
    </dl>
    {report.rosterUnavailable?<p className="faculty-proto-subtitle">Roster incomplete; missing counts unavailable.</p>:null}
   </section>
  </div>
  <section className="overflow-hidden rounded-xl border border-[#e5ebf2]">
   <h2 className="border-b border-[#e5ebf2] px-5 py-4 text-xs font-bold uppercase tracking-wide text-[#60718b]">Student scores</h2>
   <div className="faculty-proto-table-wrap">
    <table className="faculty-proto-table !rounded-none !border-0">
     <thead><tr><th>Student</th><th>Score</th><th>Handed in</th><th>Actions</th></tr></thead>
     <tbody>{submissions.map(s=><tr key={s.id}>
      <td>{s.learnerDisplayName?.trim()||"Student"}</td>
      <td>{s.gradingStatus==="GRADED"&&s.pointsAwarded!==null?
       <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">{s.pointsAwarded} / {assignment.maxPoints}</span>:
       <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">To grade</span>}</td>
      <td>{fmt(s.submittedAt)}</td>
      <td><Link className="faculty-proto-link" href={gradeHref}>Grade</Link></td>
     </tr>)}</tbody>
    </table>
   </div>
   {!submissions.length?<p className="faculty-proto-subtitle p-5">No submissions yet.</p>:null}
  </section>
 </section>;
}
