"use client";
import type {VerificationQueueCard} from "./VerificationWorkspace";
import {Button} from "@/components/ui/button";
import {useState} from "react";
import {StatusBadge} from "@/components/ui/status-badge";

function when(value:Date){
 return new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short",year:"numeric"})
  .format(value);
}
export function TpoVerificationPrototypeQueue({rows,active,onReview}:{
 rows:readonly VerificationQueueCard[];active:VerificationQueueCard|null;
 onReview:(row:VerificationQueueCard)=>void;
}){
 const waiting=rows.filter(row=>row.status==="SUBMITTED"||row.status==="UPDATE_PENDING");
 const [focusId,setFocusId]=useState<string|null>(null);
 const focus=focusId?rows.find(row=>row.learnerMembershipId+":"+row.section===focusId)??null:rows[0]??null;
 return <div data-testid="tpo.verification.prototype-queue" className="grid min-w-0 gap-4 lg:grid-cols-[minmax(250px,320px)_minmax(0,1fr)]">
  <aside aria-label="Student verification queue" className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface">
   <header className="border-b border-border px-4 py-4">
    <h2 className="text-base font-bold text-foreground">{waiting.length} waiting on this page</h2>
    <p className="mt-1 text-xs text-muted-foreground">Review the current authorized page in order, or select a student.</p>
   </header>
   <ul className="max-h-[70vh] divide-y divide-border overflow-y-auto">
    {rows.map(row=>{
     const key=row.learnerMembershipId+":"+row.section;
     return <li key={key}>
      <button type="button" onClick={()=>setFocusId(key)} aria-pressed={focus?.learnerMembershipId===row.learnerMembershipId&&focus?.section===row.section}
       className={"block min-h-11 w-full px-4 py-3 text-left hover:bg-primary-subtle "+(focus?.learnerMembershipId===row.learnerMembershipId&&focus?.section===row.section?
        "border-l-[3px] border-primary bg-primary-subtle":"")}>
       <span className="flex items-start justify-between gap-2">
        <strong className="text-sm text-foreground">{row.learnerName}</strong>
        <span className="text-[11px] text-muted-foreground">{when(row.submittedAt)}</span>
       </span>
       <span className="mt-1 block text-xs text-muted-foreground">{row.rollNumber??"No roll number"} · {row.branchName??"No branch"} · {row.section==="EDUCATION"?"Education":"Identity"}</span>
       {row.status==="UPDATE_PENDING"?<span className="mt-1 block text-xs font-semibold text-warning-text">Update to verified details</span>:null}
      </button>
     </li>;
    })}
   </ul>
   {!rows.length?<p role="status" className="p-4 text-sm text-body">No students match this verification view.</p>:null}
  </aside>
  <section aria-label="Selected verification summary" className="min-w-0 rounded-xl border border-border bg-surface">
   {focus?<><header className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4">
    <div>
     <h2 className="font-bold text-foreground">{focus.learnerName}</h2>
     <p className="mt-1 text-xs text-body">{focus.rollNumber??"No roll number"} · {focus.branchName??"No branch"} · {focus.batchName??"No batch"} · Submitted {when(focus.submittedAt)}</p>
    </div>
    <StatusBadge tone={focus.status==="VERIFIED"?"success":focus.status==="SENT_BACK"?"warning":"info"}>
     {focus.status==="UPDATE_PENDING"?"Update pending":focus.status==="SUBMITTED"?"First check":focus.status.replaceAll("_"," ").toLowerCase()}
    </StatusBadge>
   </header>
   <div className="grid min-w-0 gap-4 p-4 md:grid-cols-2">
    <section className="space-y-3">
     <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">What they submitted</h3>
     <div className="rounded-lg border border-border p-4 text-sm">
      <p className="font-semibold text-foreground">{focus.section==="EDUCATION"?"Education":"Identity"}</p>
      {focus.section==="EDUCATION"&&focus.marksheets?<p className="mt-2 text-body">
       {focus.marksheets.uploaded} of {focus.marksheets.expected} expected marksheets uploaded
      </p>:null}
      {focus.section==="EDUCATION"&&focus.missingMarksheet?<p className="mt-2 text-warning-text">
       A marksheet may be missing; check the actual evidence.</p>:null}
      {focus.attention.length?<p className="mt-2 text-body">{focus.attention.join(" · ")}</p>:null}
     </div>
     {focus.decidedAt?<p className="text-sm text-body">Last decision {when(focus.decidedAt)}
      {focus.decidedByName?" · "+focus.decidedByName:""}</p>:null}
    </section>
    <section className="space-y-3">
     <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Document review</h3>
     <div className="rounded-lg bg-surface-secondary p-4 text-sm leading-6 text-body">
      Document contents and previously verified values are available only in the secure review.
      Open it to compare the submitted data with actual uploaded evidence.
     </div>
     <Button type="button" variant="primary" className="min-h-11 md:min-h-9"
      disabled={active!==null} onClick={()=>onReview(focus)}>
      {focus.status==="VERIFIED"?"Open verification history":"Review documents"}
     </Button>
     <p className="text-xs text-muted-foreground">No documents are inferred from roster metadata. Decisions remain server-validated and version-checked.</p>
    </section>
   </div></>:<p role="status" className="p-4 text-sm text-body">Select a student to review.</p>}
  </section>
 </div>;
}
