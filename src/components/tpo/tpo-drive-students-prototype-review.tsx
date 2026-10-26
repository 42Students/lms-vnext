"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import {TpoApplicantReviewForm} from "@/components/placements/tpo-applicant-review-form";
import {applicantDrawerReviewable,type TpoApplicantReviewSnapshot}
 from "@/modules/placements/tpo-applicant-review-drawer-model";
import {applicantStage} from "@/modules/placements/tpo-applicant-pipeline-model";

type Candidate=TpoApplicantReviewSnapshot&{
 rollNumber:string|null;branchName:string|null;cgpaHundredths:number|null;
 activeBacklogs:number|null;resumeAvailable?:boolean;flags:string[];
};
type Bucket="WAITING"|"ALL"|"SHORTLISTED"|"REJECTED";
function bucketOf(row:Candidate,jobStatus:string):Bucket{
 const stage=applicantStage(row);
 return applicantDrawerReviewable(jobStatus,row)?"WAITING":
   stage==="SHORTLISTED"?"SHORTLISTED":stage==="REJECTED"?"REJECTED":"ALL";
}
function label(row:Candidate,jobStatus:string){
 const b=bucketOf(row,jobStatus);
 return b==="WAITING"?"Waiting for you":b==="SHORTLISTED"?"Shortlisted":
   b==="REJECTED"?"Not selected":applicantStage(row)==="WITHDRAWN"?
   "Withdrawn":applicantStage(row)==="HOLD"?"On hold":"Applied";
}
function shortNumber(value:number|null,divisor=1){
 return value===null?"Not recorded":(value/divisor).toLocaleString("en-IN",{maximumFractionDigits:2});
}
/** Original selected-row reviewer. A page-scoped preview never projects scores,
 * skills, resumes or eligible students that weren't returned by this job's
 * authorized applicant query. The existing guarded write form is reused;
 * changing selection alone never screens, notifies or shares anyone. */
export function TpoDriveStudentsPrototypeReview({rows,jobId,jobStatus,totalMatching,counts}:{
 rows:readonly Candidate[];jobId:string;jobStatus:string;totalMatching:number;
 counts:{all:number;shortlisted:number;rejected:number;pending:number;hold:number};
}){
 const [bucket,setBucket]=useState<Bucket>("WAITING");
 const waiting=useMemo(()=>rows.filter(row=>bucketOf(row,jobStatus)==="WAITING"),[rows,jobStatus]);
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const [visited,setVisited]=useState<string[]>([]);
 const filtered=bucket==="WAITING"?waiting:bucket==="ALL"?rows:
  rows.filter(row=>bucketOf(row,jobStatus)===bucket);
 const focused=selectedId===null?filtered[0]??null:filtered.find(row=>row.id===selectedId)??null;
 const selectedIndex=focused?filtered.findIndex(row=>row.id===focused.id):-1;
 const root="/tpo/placements/jobs/"+encodeURIComponent(jobId);
 const select=(id:string)=>{setSelectedId(id);setVisited(before=>before.includes(id)?before:[...before,id]);};
 const pick=(next:Bucket)=>{setBucket(next);setSelectedId(null);};
 const tabs=[
  {id:"WAITING",label:"Waiting for you",n:waiting.length},
  {id:"ALL",label:"All on this page",n:rows.length},
  {id:"SHORTLISTED",label:"Shortlisted",n:rows.filter(row=>bucketOf(row,jobStatus)==="SHORTLISTED").length},
  {id:"REJECTED",label:"Not selected",n:rows.filter(row=>bucketOf(row,jobStatus)==="REJECTED").length},
 ] as const;
 return <section className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]"
  aria-label="Drive students review" data-testid="tpo.drive.students.prototype-review">
  <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface" aria-label="Drive applicant queue">
   <div className="border-b border-border p-3">
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Applicant review status">
     {tabs.map(tab=><button key={tab.id} type="button" aria-pressed={bucket===tab.id}
       onClick={()=>pick(tab.id)}
       className={"inline-flex min-h-11 items-center rounded-full border px-3 text-[13px] font-semibold md:min-h-9 "+(bucket===tab.id?
        "border-primary bg-primary-subtle text-primary-text":"border-border text-body hover:bg-surface-secondary")}>
       {tab.label} · {tab.n}
      </button>)}
    </div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
     <p className="text-xs text-muted-foreground">
      {rows.length} records on this page · {totalMatching} matching this drive's filters.
      All across the scoped stage summary: {counts.all} applications · {counts.shortlisted} shortlisted · {counts.rejected} rejected.
      Counts here are page-scoped; complete stage totals are above.
     </p>
     <Link href={root+"/not-applied"} className="inline-flex min-h-9 items-center text-xs font-semibold text-link underline">
      Registered, not applied
     </Link>
    </div>
   </div>
   <div role="region" aria-label="Page-scoped applicant review rows" className="min-w-0 overflow-x-auto">
    <table className="w-full min-w-[600px] border-collapse text-left text-sm">
     <thead className="bg-surface-secondary text-[11px] uppercase tracking-wide text-muted-foreground">
      <tr><th scope="col" className="px-3 py-3">Student</th><th scope="col" className="px-3 py-3">CGPA</th>
       <th scope="col" className="px-3 py-3">Resume</th><th scope="col" className="px-3 py-3">Where they are</th>
      </tr>
     </thead>
     <tbody className="divide-y divide-border">
      {filtered.map(row=><tr key={row.id} className={focused?.id===row.id?"bg-primary-subtle":undefined}>
       <td className="px-3 py-3">
        <button type="button" onClick={()=>select(row.id)}
         aria-current={focused?.id===row.id?"true":undefined}
         className="min-h-11 text-left font-semibold text-link underline underline-offset-2 md:min-h-9">
         {row.student??"Name unavailable"}
        </button>
        <span className="block break-words text-xs text-muted-foreground">
         {row.rollNumber??"Roll not recorded"} · {row.branchName??"Branch not recorded"}
        </span>
       </td>
       <td className="px-3 py-3 tabular-nums">{shortNumber(row.cgpaHundredths,100)}</td>
       <td className="px-3 py-3 text-xs">{row.resumeAvailable===true?"Recorded":
         row.resumeAvailable===false?"No recorded resume":"Not available in this view"}</td>
       <td className="px-3 py-3 text-xs font-semibold">
        {label(row,jobStatus)}
        {row.flags.length?<span className="block max-w-[210px] break-words pt-1 font-normal text-muted-foreground">
          {row.flags.join(" · ")}
        </span>:null}
       </td>
      </tr>)}
     </tbody>
    </table>
    {!filtered.length?<p role="status" className="px-4 py-8 text-sm text-body">
      {bucket==="WAITING"?"No applicants on this page are waiting for a screening decision.":
       "No applicants on this page match this review filter."}
    </p>:null}
   </div>
   <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border p-3 text-xs text-muted-foreground">
    <p>Select a student to review one at a time. Nothing is shared just by opening a record.</p>
    <Link className="font-semibold text-link underline" href={root+"/applications-export"}>
     Review and export the full matching roster
    </Link>
   </footer>
  </section>
  <aside aria-label="Selected applicant review" className="min-w-0 rounded-xl border border-border bg-surface p-4 md:p-5">
   {!focused?<p role="status" className="text-sm text-body">Select an applicant on this authorized page to review the record.</p>:
    <div className="space-y-4">
     <header className="border-b border-border pb-3">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
       {bucket==="WAITING"?"Waiting for your decision":label(focused,jobStatus)}
       {bucket==="WAITING"?" · "+(selectedIndex+1)+" of "+filtered.length+" on this page":""}
      </p>
      <h3 className="mt-2 break-words text-xl font-bold text-foreground">{focused.student??"Name unavailable"}</h3>
      <p className="mt-1 break-words text-sm text-body">
       {focused.rollNumber??"Roll not recorded"} · {focused.branchName??"Branch not recorded"} · {focused.role}
      </p>
     </header>
     <section aria-label="Recorded applicant evidence" className="space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Recorded profile evidence</h4>
      <dl className="grid grid-cols-2 gap-3 text-sm">
       <div><dt className="text-xs text-muted-foreground">CGPA</dt><dd>{shortNumber(focused.cgpaHundredths,100)}</dd></div>
       <div><dt className="text-xs text-muted-foreground">Backlogs</dt><dd>{shortNumber(focused.activeBacklogs)}</dd></div>
       <div><dt className="text-xs text-muted-foreground">Eligibility</dt><dd>{focused.eligibilityStatus}</dd></div>
       <div><dt className="text-xs text-muted-foreground">Screening</dt><dd>{focused.screeningStatus??"Pending"}</dd></div>
       <div><dt className="text-xs text-muted-foreground">Application</dt><dd>{focused.applicationStatus}</dd></div>
       <div><dt className="text-xs text-muted-foreground">Resume</dt><dd>{focused.resumeAvailable===true?"Recorded":focused.resumeAvailable===false?"Not recorded":"Not available in this view"}</dd></div>
      </dl>
      <p className="text-xs leading-5 text-muted-foreground">
       Skill matches, project details and resume recency are not verified in this roster projection;
       open the authorized full application for original documents and evidence.
      </p>
      <Link href={root+"/applicants/"+encodeURIComponent(focused.id)}
       className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
       Open full profile and resume
      </Link>
     </section>
     {applicantDrawerReviewable(jobStatus,focused)&&focused.screeningUpdatedAt?
      <TpoApplicantReviewForm key={focused.id+":"+focused.screeningUpdatedAt}
       jobId={jobId} applicationId={focused.id}
       expectedUpdatedAt={focused.screeningUpdatedAt}/>:
      <p role="status" className="rounded-lg bg-surface-secondary p-3 text-sm text-body">
       This applicant is not currently eligible for a new screening decision.
       Only submitted pending or held applications in a published drive can be reviewed.
      </p>}
     <nav aria-label="Review next applicant" className="flex flex-wrap gap-2 border-t border-border pt-3">
      <button type="button" disabled={selectedIndex<=0}
       onClick={()=>{const next=filtered[selectedIndex-1];if(next)select(next.id);}}
       className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-semibold text-body disabled:opacity-50 md:min-h-9">
       Previous
      </button>
      <button type="button" disabled={selectedIndex<0||selectedIndex>=filtered.length-1}
       onClick={()=>{const next=filtered[selectedIndex+1];if(next)select(next.id);}}
       className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-semibold text-body disabled:opacity-50 md:min-h-9">
       Skip to next
      </button>
     </nav>
     {visited.length>0?<p className="text-xs text-muted-foreground">
      {visited.length} distinct applicant previews opened in this session; opening does not record a decision.
     </p>:null}
    </div>}
  </aside>
 </section>;
}
