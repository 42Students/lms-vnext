"use client";
import Link from "next/link";
import {useId,useRef} from "react";
import {TpoApplicantReviewForm} from "./tpo-applicant-review-form";
import {applicantDrawerReviewable,type TpoApplicantReviewSnapshot} from "@/modules/placements/tpo-applicant-review-drawer-model";
export function TpoApplicantReviewDrawer({jobId,jobStatus,app}:{
 jobId:string;jobStatus:string;app:TpoApplicantReviewSnapshot;
}){
 const dialog=useRef<HTMLDialogElement>(null),titleId=useId();
 return <>
  <button type="button" onClick={()=>dialog.current?.showModal()}
   className="mt-2 min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
   Review applicant
  </button>
  <dialog ref={dialog} aria-labelledby={titleId}
   className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl border border-border bg-surface p-4 text-foreground backdrop:bg-black/40 sm:p-6">
   <div className="mb-4 flex items-start justify-between gap-3">
    <h2 id={titleId} className="min-w-0 break-words text-lg font-semibold">{app.student??"Name unavailable"}</h2>
    <button type="button" onClick={()=>dialog.current?.close()}
     className="min-h-11 shrink-0 rounded-md border border-border px-3 text-sm font-semibold">Close</button>
   </div>
   <dl className="mb-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
    <div><dt className="text-body">Role</dt><dd className="break-words">{app.role}</dd></div>
    <div><dt className="text-body">Application</dt><dd>{app.applicationStatus}</dd></div>
    <div><dt className="text-body">Screening</dt><dd>{app.screeningStatus??"Not recorded"}</dd></div>
    <div><dt className="text-body">Eligibility</dt><dd>{app.eligibilityStatus}</dd></div>
    <div><dt className="text-body">Channel</dt><dd>{app.channel}</dd></div>
    <div><dt className="text-body">Submitted</dt><dd>{new Date(app.submittedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</dd></div>
   </dl>
   {applicantDrawerReviewable(jobStatus,app)&&app.screeningUpdatedAt?
    <TpoApplicantReviewForm key={app.screeningUpdatedAt} jobId={jobId} applicationId={app.id}
     expectedUpdatedAt={app.screeningUpdatedAt}/>:
    <p role="status" className="text-sm text-body">This application is read-only. Review requires a published drive and a pending or held submitted application.</p>}
   <Link href={"/tpo/placements/jobs/"+jobId+"/applicants/"+app.id}
    className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline">
    Open full applicant detail →
   </Link>
  </dialog>
 </>;
}
