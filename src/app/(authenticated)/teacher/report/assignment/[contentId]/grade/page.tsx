import Link from "next/link";
import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getFacultyAssignmentReport} from "@/modules/courses/faculty-assessment-report-service";
import {FacultyAssignmentReview} from "@/components/courses/faculty-assignment-review";
import {FacultySubmissionFileReview} from "@/components/courses/faculty-submission-file-review";
import {assignmentFilesRuntimeEnabled} from "@/modules/courses/assignment-file-readiness";
import {facultyAssignmentReportHidden} from "@/modules/courses/faculty-assessment-route-boundary";

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
 const selected=report.submissions.find(row=>row.id===query.student)??(filter==="graded"?graded[0]:filter==="pending"?ungraded[0]:submissions[0])??null;
 const visible=filter==="graded"?graded:filter==="pending"?ungraded:filter==="missing"?[]:submissions;
 const root="/teacher/report/assignment/"+encodeURIComponent(assignment.id)+"/grade";
 const href=(f:string,student?:string)=>root+"?deliveryId="+encodeURIComponent(assignment.deliveryId)+
   (f==="all"?"":"&filter="+encodeURIComponent(f))+(student?"&student="+encodeURIComponent(student):"");
 const stamp=(value:Date)=>new Intl.DateTimeFormat("en-IN",{
   timeZone:"Asia/Kolkata",day:"numeric",month:"short",hour:"numeric",minute:"2-digit"
  }).format(value);
 const percent=report.rosterUnavailable?null:metrics.eligibleLearners;
 return <section className="space-y-5" aria-label="Faculty assignment grading prototype">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <Link className="faculty-proto-link" href="/teacher/assessments">‹ Assignments & quizzes</Link>
   <Link className="faculty-proto-secondary" href={"/teacher/report/assignment/"+encodeURIComponent(assignment.id)+
     "?deliveryId="+encodeURIComponent(assignment.deliveryId)}>Class report</Link>
  </div>
  <div><h1 className="faculty-proto-heading">{assignment.title}</h1>
   <p className="faculty-proto-subtitle">{assignment.courseName} · {assignment.sectionName} · {assignment.dueAt?"due "+stamp(assignment.dueAt):"no due date"} · {assignment.maxPoints} points · {metrics.submitted}{percent===null?"":"/"+percent} handed in</p>
  </div>
  <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(280px,0.38fr)_minmax(0,1fr)]">
   <aside className="overflow-hidden rounded-xl border border-[#e5ebf2]">
    <nav className="flex flex-wrap gap-2 border-b border-[#e5ebf2] px-4 py-4" aria-label="Submission grading filters">
     {[
      {key:"all",label:"All",count:percent??submissions.length},
      {key:"pending",label:"To grade",count:ungraded.length},
      {key:"graded",label:"Graded",count:graded.length},
      {key:"missing",label:"Missing",count:report.rosterUnavailable?"—":missingLearners.length},
     ].map(item=><Link key={item.key} href={href(item.key)}
      className="faculty-proto-pill no-underline" aria-current={filter===item.key?"page":undefined}
      style={filter===item.key?{color:"#007f8e",background:"#eaf8fa",borderColor:"#078191"}:undefined}>{item.label} {item.count}</Link>)}
    </nav>
    <ol className="divide-y divide-[#edf1f5]">
     {visible.map(row=><li key={row.id} className={"border-l-[3px] "+(row.id===selected?.id?"border-[#078191] bg-[#f0f9fa]":"border-transparent")}>
      <Link className="flex min-h-16 items-center gap-3 px-4 py-3 no-underline" href={href(filter,row.id)}>
       <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e1f1f4] text-xs font-bold text-[#007f8e]">
        {(row.learnerDisplayName?.trim().slice(0,2)??"ST").toUpperCase()}
       </span>
       <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-[#1d293f]">{row.learnerDisplayName??row.learnerEmail??"Student"}</strong>
        <span className="faculty-proto-subtitle">{stamp(row.submittedAt)} IST</span></span>
       <span className={"shrink-0 rounded-full px-2 py-1 text-xs font-bold "+
        (row.gradingStatus==="GRADED"?"bg-emerald-50 text-emerald-700":"bg-red-50 text-red-700")}>
        {row.gradingStatus==="GRADED"?String(row.pointsAwarded??0)+"/"+assignment.maxPoints:"To grade"}</span>
      </Link>
     </li>)}
     {filter==="missing"?missingLearners.map(row=><li key={row.membershipId} className="px-4 py-4 text-sm">
      <strong>{row.displayName??"Student"}</strong> · Missing submission
     </li>):null}
    </ol>
    {!visible.length&&filter!=="missing"?<p className="faculty-proto-subtitle p-4">No matching submissions.</p>:null}
   </aside>
   <div className="min-w-0 overflow-hidden rounded-xl border border-[#e5ebf2]">
    {selected&&filter!=="missing"?<>
     <header className="border-b border-[#e5ebf2] px-5 py-5">
      <h2 className="text-xl font-bold text-[#1d293f]">{selected.learnerDisplayName??"Student"}</h2>
      <p className="faculty-proto-subtitle">Handed in {stamp(selected.submittedAt)} IST · {selected.gradingStatus==="GRADED"?"Graded":"To grade"}</p>
     </header>
     <div className="min-h-56 border-b border-[#e5ebf2] px-5 py-5">
      {selected.submissionType==="FILE"&&assignmentFilesRuntimeEnabled()?
       <FacultySubmissionFileReview submissionId={selected.id}/>:
       selected.textContent?<article className="rounded-xl bg-[#f7f9fc] p-6 text-sm whitespace-pre-wrap text-[#40516a]">{selected.textContent}</article>:
       selected.submissionUrl&&/^https:\/\//i.test(selected.submissionUrl)?
        <Link className="faculty-proto-link" href={selected.submissionUrl} target="_blank" rel="noopener noreferrer">Open student submission</Link>:
        <p className="faculty-proto-subtitle">No preview is available for this submission. Use the grading editor to see supported submission details.</p>}
     </div>
     <div className="px-5 py-5">
      <h3 className="text-sm font-bold text-[#1d293f]">Grade and student feedback</h3>
      <p className="faculty-proto-subtitle mt-1">Open the verified grading editor to enter a score, save privately, or publish it to the learner.</p>
      <FacultyAssignmentReview assignmentId={assignment.id} deliveryId={assignment.deliveryId}
       filesEnabled={assignmentFilesRuntimeEnabled()} maxPoints={assignment.maxPoints} status={assignment.status}/>
     </div>
    </>:<p className="faculty-proto-subtitle p-6">Select a submitted learner to see their work. Missing students have no submission to grade.</p>}
   </div>
  </div>
 </section>;
}
