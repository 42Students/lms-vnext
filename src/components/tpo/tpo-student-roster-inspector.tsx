"use client";
import Link from "next/link";
import type {TpoStudentRow} from "@/modules/placements/tpo-students-model";
import {tpoStudentDisplayLabel} from "@/modules/placements/tpo-student-display-label";
import {Button} from "@/components/ui/button";

function initials(name:string){
 return name.trim().split(/\s+/).slice(0,2).map(part=>part.charAt(0).toUpperCase()).join("")||"S";
}
function status(status:TpoStudentRow["verification"]["status"]){
 return status==="VERIFIED"?"Verified":
  status==="WAITING"?"To verify":
  status==="SENT_BACK"?"Correction needed":
  status==="NOT_VERIFIED"?"Not verified":"Unavailable";
}
export function TpoStudentRosterInspector({student,onDetails,onDismiss}:{
 student:TpoStudentRow;onDetails:()=>void;onDismiss:()=>void;
}){
 const studentHref="/tpo/students/"+encodeURIComponent(student.membershipId);
 const verification=status(student.verification.status);
 const needsReview=student.verification.status==="WAITING"||student.verification.status==="SENT_BACK";
 const hasResume=student.profileFacts?.resume;
 const profile=[
  {label:"Placement registration",value:student.registeredForPlacements?"Registered":"Not registered"},
  {label:"Resume",value:hasResume===undefined?"Not recorded":hasResume?"Provided":"Missing"},
  {label:"Marks & documents",value:verification},
  {label:"Academic evidence",value:student.marksVerified===true?"Verified":student.marksVerified===false?"Not verified":"Unavailable"},
 ];
 return <aside className="min-w-0 rounded-xl border border-border bg-surface p-4 md:p-5"
  aria-label={"Selected student: "+student.displayName}
  data-testid="tpo.students.prototype-inspector">
  <div className="flex items-start gap-3">
   <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-sm font-bold text-primary-text">
    {initials(student.displayName)}
   </span>
   <div className="min-w-0 flex-1">
    <h3 className="break-words text-base font-bold text-foreground">{student.displayName}</h3>
    <p className="mt-1 break-words text-xs leading-5 text-body">
     {student.rollNumber??student.registrationNumber??"No roll number"} · {student.branchName} · {student.cohortName}
    </p>
   </div>
   <button type="button" onClick={onDismiss} aria-label="Close student summary"
    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border text-body md:min-h-9 md:min-w-9">×</button>
  </div>
  {needsReview?<section className="mt-4 rounded-lg bg-warning-subtle p-3" aria-label="Verification needed">
   <strong className="text-xs font-bold uppercase tracking-wide text-warning-text">{verification}</strong>
   <p className="mt-1 text-sm font-semibold text-foreground">{student.verification.status==="WAITING"?
    "Submitted documents are awaiting verification":
    "The student has been asked to correct documents"}</p>
   {student.verification.waitingSections.length?
    <p className="mt-1 text-xs text-body">Sections: {student.verification.waitingSections.join(", ")}</p>:null}
  </section>:null}
  {student.debarred===true?<p className="mt-3 rounded-lg bg-warning-subtle p-3 text-sm text-warning-text">
   Debarred from new placement applications
  </p>:null}
  <div className="mt-4 flex flex-wrap gap-2">
   <Button type="button" variant="primary" onClick={onDetails}
    className="min-h-11 md:min-h-9">Review student</Button>
   {needsReview?<Link href="/tpo/verification"
    className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-semibold text-link md:min-h-9">
    Verification queue
   </Link>:null}
   <Link href="/tpo/placements"
    className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-semibold text-link md:min-h-9">
    Drives
   </Link>
  </div>
  <dl className="mt-4 space-y-3 border-t border-border pt-3 text-[13px]">
   <div className="flex items-start justify-between gap-3">
    <dt className="text-muted-foreground">Placement stage</dt>
    <dd className="text-right font-semibold text-foreground">{tpoStudentDisplayLabel(student.journeyState)}</dd>
   </div>
   <div className="flex items-start justify-between gap-3">
    <dt className="text-muted-foreground">Best so far</dt>
    <dd className="max-w-[60%] text-right text-foreground">{student.bestCompany?student.bestCompany+" · ":""}{tpoStudentDisplayLabel(student.bestSoFar)}</dd>
   </div>
   <div className="flex items-start justify-between gap-3">
    <dt className="text-muted-foreground">Applications</dt>
    <dd className="font-semibold tabular-nums text-foreground">{student.applicationCount}</dd>
   </div>
   <div className="flex items-start justify-between gap-3">
    <dt className="text-muted-foreground">Offers</dt>
    <dd className="font-semibold tabular-nums text-foreground">{student.offerCount}</dd>
   </div>
   {student.offersAwaitingAnswer>0?<p className="rounded-lg bg-warning-subtle px-3 py-2 text-warning-text">
    {student.offersAwaitingAnswer} offer(s) awaiting an answer
   </p>:null}
  </dl>
  <section aria-label="Student profile checklist" className="mt-4 border-t border-border pt-3">
   <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Profile</h4>
   <dl className="space-y-2">
    {profile.map(item=><div key={item.label} className="flex items-start justify-between gap-3 text-[13px]">
     <dt className="text-body">{item.label}</dt>
     <dd className="text-right font-semibold text-foreground">{item.value}</dd>
    </div>)}
   </dl>
  </section>
  <div className="mt-4 space-y-2 border-t border-border pt-3">
   <Link href={studentHref+"/history"} className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9">
    Placement history
   </Link>
   <div><Link href={studentHref+"/participation"} className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9">
    Review participation
   </Link></div>
  </div>
 </aside>;
}
