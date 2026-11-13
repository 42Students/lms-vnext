import {facultyReportCsvHref} from "@/modules/courses/faculty-report-csv-request";
import type {getFacultyAssignmentReport} from "@/modules/courses/faculty-assessment-report-service";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";
import { istIsoDateFormatter, istWeekdayDayMonthFormatter } from "@/lib/format-date";
import { createDateFormatter } from "@/lib/format-date";
import { Table } from "@/components/ui/table";

import { DEFAULT_TIME_ZONE } from "@/config/locale";
type Report=Awaited<ReturnType<typeof getFacultyAssignmentReport>>;
const istDay=(date:Date)=>istIsoDateFormatter.format(date);
const dayLabel=(date:Date)=>istWeekdayDayMonthFormatter.format(date);
const shortDay=(date:Date)=>createDateFormatter("en-IN", {
 timeZone:DEFAULT_TIME_ZONE,day:"numeric",month:"short",
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
  <TextLink variant="bare" className="faculty-proto-link" href="/teacher/assessments">‹ Assignments &amp; quizzes</TextLink>
  <header className="flex flex-wrap items-end justify-between gap-3">
   <div><Heading level={1} className="faculty-proto-heading">{assignment.title?.trim()||"Untitled assignment"}</Heading>
    <p className="faculty-proto-subtitle mt-1">{assignment.courseCode} · {assignment.sectionName} · {assignment.dueAt?
      "due "+dayLabel(assignment.dueAt):"No due date"}</p>
   </div>
   <nav aria-label="Assessment report type" className="flex flex-wrap gap-2">
    <span className="faculty-proto-pill border-[color:var(--lms-button-primary)] bg-[color:var(--lms-primary-subtle)] text-[color:var(--lms-button-primary)]" aria-current="page">
      Assignment report</span>
    <TextLink className="faculty-proto-pill" href="/teacher/allQuizzes">Quiz report</TextLink>
   </nav>
  </header>
  <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{values.map(item=><div key={item.label}
   className="rounded-xl border border-[color:var(--lms-border)] px-[20px] py-4">
   <dt className="faculty-proto-subtitle">{item.label}</dt>
   <dd className="mt-1 text-2xl font-bold text-[color:var(--lms-heading)] tabular-nums">{item.value}</dd>
  </div>)}</dl>
  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
   <section className="rounded-xl border border-[color:var(--lms-border)] px-[20px] py-5">
    <Heading level={2} size="xs" className="uppercase tracking-wide text-[color:var(--lms-text-muted)]">Score distribution</Heading>
    {metrics.graded? <div className="mt-4 flex min-h-[160px] items-end gap-2" role="img"
     aria-label={distribution.map(bucket=>bucket.label+": "+bucket.count).join(", ")}>
     {[...distribution].reverse().map(bucket=><div className="flex min-w-0 flex-1 flex-col items-center"
      key={bucket.label}>
      <strong className="text-xs font-semibold tabular-nums">{bucket.count}</strong>
      <div className="mt-1 w-full rounded-t bg-[color:var(--lms-button-primary)]"
       style={{height:Math.max(bucket.count?7:1,136*bucket.count/max)}}/>
      <span className="mt-1 text-center text-xs text-[color:var(--lms-text-muted)]">{bucket.label}</span>
     </div>)}
    </div>:<p className="faculty-proto-subtitle mt-5">No graded submissions yet.</p>}
   </section>
   <section className="rounded-xl border border-[color:var(--lms-border)] px-[20px] py-5">
    <Heading level={2} size="xs" className="uppercase tracking-wide text-[color:var(--lms-text-muted)]">When they handed in</Heading>
    <dl className="mt-2 divide-y divide-[color:var(--lms-neutral-100)]">{summary.map(item=><div key={item.label}
     className="flex items-center justify-between py-3 text-sm">
     <dt className="text-[color:var(--lms-text-body)]">{item.label}</dt>
     <dd className={"font-semibold tabular-nums "+(item.label==="Late"&&item.value!==0?
       "text-[color:var(--lms-error-text)]":"text-[color:var(--lms-heading)]")}>{item.value}</dd>
    </div>)}</dl>
    {report.rosterUnavailable?<p className="faculty-proto-subtitle">The roster is unavailable; missing counts cannot be calculated.</p>:null}
   </section>
  </div>
  <section className="overflow-hidden rounded-xl border border-[color:var(--lms-border)]">
   <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[color:var(--lms-border)] px-[20px] py-4">
    <Heading level={2} size="xs" className="uppercase tracking-wide text-[color:var(--lms-text-muted)]">Student scores</Heading>
    <TextLink variant="bare" className="faculty-proto-secondary min-h-9 px-3 py-1.5 text-xs"
     href={csvHref}>Download as spreadsheet</TextLink>
   </header>
   <Table>
     <thead><tr><th>Student</th><th>Score</th><th>Handed in</th><th><span className="sr-only">Actions</span></th></tr></thead>
     <tbody>{submissions.map(item=>{
      const graded=item.gradingStatus==="GRADED"&&item.pointsAwarded!==null;
      const href=gradeHref+"&student="+encodeURIComponent(item.id);
      return <tr key={item.id}>
       <td>{item.learnerDisplayName?.trim()||"Student"}</td>
       <td>{graded?<span className="rounded-full bg-[color:var(--lms-success-surface)] px-2 py-1 text-xs font-bold text-[color:var(--lms-success)]">
        {item.pointsAwarded} / {assignment.maxPoints}</span>:
        <span className="rounded-full bg-[color:var(--lms-error-surface)] px-2 py-1 text-xs font-bold text-[color:var(--lms-error-text)]">To grade</span>}</td>
       <td>{dayLabel(item.submittedAt)}</td>
       <td className="text-right"><TextLink variant="bare" className={(graded?"faculty-proto-secondary":"faculty-proto-action")+
        " min-h-9 px-3 py-1.5 text-xs"} href={href}>{graded?"Open":"Grade"}</TextLink></td>
      </tr>;
     })}
     {!report.rosterUnavailable?missingLearners.map(student=><tr key={"missing-"+student.membershipId}>
      <td>{student.displayName?.trim()||"Student"}</td>
      <td><span className="rounded-full bg-[color:var(--lms-neutral-100)] px-2 py-1 text-xs font-bold text-[color:var(--lms-text-muted)]">Missing</span></td>
      <td>—</td>
      <td className="text-right"><TextLink variant="bare" className="faculty-proto-secondary min-h-9 px-3 py-1.5 text-xs"
       href={"/teacher/courses/"+encodeURIComponent(assignment.deliveryId)+"/students/"+
        encodeURIComponent(student.membershipId)}>View student</TextLink></td>
     </tr>):null}
     </tbody>
    </Table>
   {!submissions.length&&!missingLearners.length?<p className="faculty-proto-subtitle p-5">
    {report.rosterUnavailable?"No known submissions. The roster could not be verified.":"No submissions yet."}</p>:null}
  </section>
  <p className="sr-only">Grading is restricted to this authorized Section. Scores remain private to learners until published.</p>
 </section>;
}
