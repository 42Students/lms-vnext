import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getFacultyAssignmentReport} from "@/modules/courses/faculty-assessment-report-service";
import {FacultyPrototypeInlineGrader} from "@/components/courses/faculty-prototype-inline-grader";
import {FacultySubmissionFileReview} from "@/components/courses/faculty-submission-file-review";
import {assignmentFilesRuntimeEnabled} from "@/modules/courses/assignment-file-readiness";
import {facultyAssignmentReportHidden} from "@/modules/courses/faculty-assessment-route-boundary";
import {facultyGradingSelectedSubmission} from "@/modules/courses/faculty-grading-selection-model";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";

type Params={deliveryId?:string;student?:string;filter?:string};
export default async function FacultyAssignmentGradePage({params,searchParams}:{
 params:Promise<{contentId:string}>;searchParams:Promise<Params>;
}){
 const {contentId}=await params;
 const query=await searchParams;
 const context=await getCurrentRequestContext();
 let report:Awaited<ReturnType<typeof getFacultyAssignmentReport>>;
 try{report=await getFacultyAssignmentReport(context,contentId,query.deliveryId??null);}
 catch(error){if(facultyAssignmentReportHidden(error))notFound();throw error;}
 const {assignment,submissions,missingLearners,metrics}=report;
 const filter=query.filter==="pending"||query.filter==="graded"||query.filter==="missing"?query.filter:"all";
 const ungraded=submissions.filter(row=>row.gradingStatus!=="GRADED");
 const graded=submissions.filter(row=>row.gradingStatus==="GRADED");
 // Select from the current filter, not from the full data set. A forged or
 // stale ?student= ID cannot make a pending submission appear under Graded.
 const visible=filter==="graded"?graded:filter==="pending"?ungraded:filter==="missing"?[]:submissions;
 const selected=facultyGradingSelectedSubmission(visible,query.student);
 const position=selected?visible.findIndex(row=>row.id===selected.id):-1;
 const previous=position>0?visible[position-1]:null;
 const next=position>=0&&position<visible.length-1?visible[position+1]:null;
 const root="/teacher/report/assignment/"+encodeURIComponent(assignment.id)+"/grade";
 const href=(f:string,student?:string)=>root+"?deliveryId="+encodeURIComponent(assignment.deliveryId)+
   (f==="all"?"":"&filter="+encodeURIComponent(f))+(student?"&student="+encodeURIComponent(student):"");
 const stamp=(value:Date)=>new Intl.DateTimeFormat("en-IN",{
   timeZone:"Asia/Kolkata",day:"numeric",month:"short",hour:"numeric",minute:"2-digit"
  }).format(value);
 const percent=report.rosterUnavailable?null:metrics.eligibleLearners;
 return <section className="space-y-5" aria-label="Faculty assignment grading prototype">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <TextLink variant="bare" className="faculty-proto-link" href="/teacher/assessments">‹ Assignments & quizzes</TextLink>
   <TextLink variant="bare" className="faculty-proto-secondary" href={"/teacher/report/assignment/"+encodeURIComponent(assignment.id)+
     "?deliveryId="+encodeURIComponent(assignment.deliveryId)}>Class report</TextLink>
  </div>
  <div><Heading level={1} className="faculty-proto-heading">{assignment.title}</Heading>
   <p className="faculty-proto-subtitle">{assignment.courseCode} · {assignment.sectionName} · {assignment.dueAt?"due "+stamp(assignment.dueAt):"no due date"} · {assignment.maxPoints} points · {metrics.submitted}{percent===null?"":" of "+percent} handed in, {ungraded.length} to grade</p>
  </div>
  <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(280px,0.38fr)_minmax(0,1fr)]">
   <aside className="overflow-hidden rounded-xl border border-[color:var(--lms-border)]">
    <nav className="flex flex-wrap gap-2 border-b border-[color:var(--lms-border)] px-4 py-4" aria-label="Submission grading filters">
     {[
      {key:"all",label:"All",count:percent??submissions.length},
      {key:"pending",label:"To grade",count:ungraded.length},
      {key:"graded",label:"Graded",count:graded.length},
      {key:"missing",label:"Missing",count:report.rosterUnavailable?"—":missingLearners.length},
     ].map(item=><TextLink key={item.key} href={href(item.key)}
      className="faculty-proto-pill" aria-current={filter===item.key?"page":undefined}
      style={filter===item.key?{color:"var(--lms-button-primary)",background:"var(--lms-primary-subtle)",borderColor:"var(--lms-button-primary)"}:undefined}>{item.label} {item.count}</TextLink>)}
    </nav>
    <ol className="divide-y divide-[color:var(--lms-neutral-100)]">
     {visible.map(row=><li key={row.id} className={"border-l-2 "+(row.id===selected?.id?"border-[color:var(--lms-button-primary)] bg-[color:var(--lms-primary-subtle)]":"border-transparent")}>
      <TextLink className="flex min-h-16 items-center gap-3 px-4 py-3" href={href(filter,row.id)}>
       <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--lms-primary-subtle)] text-xs font-bold text-[color:var(--lms-button-primary)]">
        {(row.learnerDisplayName?.trim().split(/\s+/).map(part=>part[0]??"").slice(0,2).join("")??"ST").toUpperCase()}
       </span>
       <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-heading">{row.learnerDisplayName??row.learnerEmail??"Student"}</strong>
        <span className="faculty-proto-subtitle">{stamp(row.submittedAt)} IST</span></span>
       <span className={"shrink-0 rounded-full px-2 py-1 text-xs font-bold "+
        (row.gradingStatus==="GRADED"?"bg-[color:var(--lms-success-surface)] text-[color:var(--lms-success)]":"bg-[color:var(--lms-error-surface)] text-[color:var(--lms-error-text)]")}>
        {row.gradingStatus==="GRADED"?String(row.pointsAwarded??0)+"/"+assignment.maxPoints:"To grade"}</span>
      </TextLink>
     </li>)}
     {(filter==="missing"||filter==="all")?missingLearners.map(row=><li key={row.membershipId} className="border-l-2 border-l-transparent px-4 py-4 text-sm">
      <strong>{row.displayName??"Student"}</strong> · Missing submission
     </li>):null}
    </ol>
    {!visible.length&&filter!=="missing"?<p className="faculty-proto-subtitle p-4">No matching submissions.</p>:null}
   </aside>
   <div className="min-w-0 overflow-hidden rounded-xl border border-[color:var(--lms-border)]">
    {selected&&filter!=="missing"?<>
     <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[color:var(--lms-border)] px-5 py-5">
      <div><Heading level={2} size="lg" className="text-heading">{selected.learnerDisplayName??"Student"}</Heading>
       <p className="faculty-proto-subtitle">Handed in {stamp(selected.submittedAt)} IST · {selected.gradingStatus==="GRADED"?"Graded":"To grade"}</p></div>
      <nav aria-label="Submission navigation" className="flex shrink-0 gap-2">
       {previous?<TextLink variant="bare" className="faculty-proto-secondary min-h-9 px-3 py-1.5 text-xs"
         href={href(filter,previous.id)}>‹ Previous</TextLink>:
        <span className="faculty-proto-secondary opacity-50 min-h-9 px-3 py-1.5 text-xs">‹ Previous</span>}
       {next?<TextLink variant="bare" className="faculty-proto-secondary min-h-9 px-3 py-1.5 text-xs"
         href={href(filter,next.id)}>Next ›</TextLink>:
        <span className="faculty-proto-secondary opacity-50 min-h-9 px-3 py-1.5 text-xs">Next ›</span>}
      </nav>
     </header>
     <div className="min-h-56 border-b border-[color:var(--lms-border)] px-5 py-5">
      {selected.submissionType==="FILE"&&assignmentFilesRuntimeEnabled()?
       <FacultySubmissionFileReview submissionId={selected.id}/>:
       selected.textContent?<article className="rounded-xl bg-surface p-6 text-sm whitespace-pre-wrap text-body">{selected.textContent}</article>:
       selected.submissionUrl&&/^https:\/\//i.test(selected.submissionUrl)?
        <TextLink variant="bare" className="faculty-proto-link" href={selected.submissionUrl} rel="noopener noreferrer">Open student submission</TextLink>:
        <p className="faculty-proto-subtitle">No preview is available for this submission. Use the grading editor to see supported submission details.</p>}
     </div>
     <div className="px-5 py-5">
      <Heading level={3} size="sm" className="text-heading">Grade and student feedback</Heading>
      <p className="faculty-proto-subtitle mt-1">Open the verified grading editor to enter a score, save privately, or publish it to the learner.</p>
      <FacultyPrototypeInlineGrader key={selected.id+":"+selected.version}
       submission={{
        id:selected.id,assignmentId:selected.assignmentId,deliveryId:selected.deliveryId,
        membershipId:selected.membershipId,submissionType:selected.submissionType,
        textContent:selected.textContent,submissionUrl:selected.submissionUrl,
        submittedAt:selected.submittedAt.toISOString(),pointsAwarded:selected.pointsAwarded,
        feedback:selected.feedback,gradingStatus:selected.gradingStatus,
        gradePublished:selected.gradePublished,version:selected.version,
        learnerDisplayName:selected.learnerDisplayName,learnerEmail:selected.learnerEmail,
       }}
       filesEnabled={assignmentFilesRuntimeEnabled()} maxPoints={assignment.maxPoints}
       nextStudentHref={next?href(filter,next.id):null}/>
       <TextLink variant="bare" className="faculty-proto-link mt-4 inline-block" href={"/teacher/report/assignment/"+encodeURIComponent(assignment.id)+"/submissions?deliveryId="+encodeURIComponent(assignment.deliveryId)}>Advanced submissions review and grading history</TextLink>
     </div>
    </>:<p className="faculty-proto-subtitle p-6">Select a submitted learner to see their work. Missing students have no submission to grade.</p>}
   </div>
  </div>
 </section>;
}
