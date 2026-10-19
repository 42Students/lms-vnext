"use client";
import Link from "next/link";
import {useState,type KeyboardEvent} from "react";
import {Drawer} from "@/components/ui/drawer";
import {useRouter} from "next/navigation";
import {TpoApplicantReviewForm} from "./tpo-applicant-review-form";
import {applicantDrawerReviewable,type TpoApplicantReviewSnapshot} from "@/modules/placements/tpo-applicant-review-drawer-model";
import {Button} from "@/components/ui/button";
export function TpoApplicantReviewDrawer({jobId,jobStatus,app,previousId,nextId}:{
 jobId:string;jobStatus:string;app:TpoApplicantReviewSnapshot;previousId?:string;nextId?:string;
}){
 const [open,setOpen]=useState(false),router=useRouter();
 const applicantHref=(id:string)=>"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/applicants/"+encodeURIComponent(id);
 function move(event:KeyboardEvent<HTMLDivElement>){
  if(event.altKey||event.ctrlKey||event.metaKey)return;
  const target=event.target as HTMLElement;
  if(target.closest("input,select,textarea,button,[contenteditable]"))return;
  const id=event.key==="ArrowLeft"?previousId:event.key==="ArrowRight"?nextId:null;
  if(id){event.preventDefault();setOpen(false);router.push(applicantHref(id));}
 }
 return <>
  <Button variant="secondary" type="button" onClick={()=>setOpen(true)}
   className="mt-2">
   Review applicant
  </Button>
  <Drawer open={open} onOpenChange={setOpen} title={app.student??"Name unavailable"}>
   <div onKeyDown={move} className="min-w-0 space-y-4">
    <div className="flex justify-end"><Button variant="secondary" type="button" onClick={()=>setOpen(false)}
     >Close</Button></div>
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
   <nav aria-label="Review neighbours" className="flex flex-wrap gap-3 text-sm">
    {previousId?<Link href={applicantHref(previousId)} className="inline-flex min-h-11 md:min-h-9 items-center text-[var(--lms-teal-deep)] underline">← Previous applicant</Link>:null}
    {nextId?<Link href={applicantHref(nextId)} className="inline-flex min-h-11 md:min-h-9 items-center text-[var(--lms-teal-deep)] underline">Next applicant →</Link>:null}
   </nav>
   <p className="text-xs text-body">Use left and right arrows outside form controls to open the previous or next applicant.</p>
   <Link href={"/tpo/placements/jobs/"+jobId+"/applicants/"+app.id}
    className="mt-4 inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-[var(--lms-teal-deep)] hover:underline">
    Open full applicant detail →
   </Link>
   </div>
  </Drawer>
 </>;
}
