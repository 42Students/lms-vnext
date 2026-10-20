import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {Banner} from "@/components/ui/banner";
import {EmptyState} from "@/components/ui/empty-state";
import {hasMembershipRole} from "@/modules/identity/context";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {getTpoDriveApplicationsExport} from "@/modules/placements/tpo-drive-applications-export-service";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
export default async function TpoApplicationsExportPage({params,searchParams}:{
 params:Promise<{jobId:string}>;searchParams:Promise<{stage?:string|string[];search?:string|string[];channel?:string|string[];eligibility?:string|string[];flag?:string|string[];sort?:string|string[];submittedWithin?:string|string[]}>;
}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const {jobId}=await params;
 const filters=await searchParams;
 let result:Awaited<ReturnType<typeof getTpoDriveApplicationsExport>>;
 try{result=await getTpoDriveApplicationsExport(context,{...filters,jobId});}
 catch(error){if(error instanceof PlacementsServiceError&&error.code==="PLACEMENT_JOB_NOT_FOUND")notFound();throw error;}
 const query=new URLSearchParams({stage:result.stage,search:result.search,channel:result.channel,eligibility:result.eligibility,flag:result.flag,sort:result.sort,submittedWithin:result.submittedWithin}).toString();
 const stages=["ALL","SUBMITTED","PENDING","HOLD","SHORTLISTED","REJECTED","WITHDRAWN"] as const;
 return <div className="min-w-0 space-y-6">
  <PageHeader eyebrow="TPO · Export applicants" title={result.job.title+" · Applications"}
   description="Read-only college-scoped export preview without internal screening notes."
   actions={<div className="flex w-full flex-col items-stretch gap-2 min-[768px]:w-auto min-[768px]:flex-row min-[768px]:items-center">
    <Link href={"/tpo/placements/jobs/"+jobId+"/applicants-pipeline?"+query} className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-[var(--lms-link-text)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9">← Applicants</Link>
    <a href={"/api/placements/tpo/jobs/"+jobId+"/applications/export?"+query} download
     className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary min-[768px]:min-h-9">Download all matching CSV</a>
   </div>}/>
  <form method="get" className="grid min-w-0 items-end gap-3 border-b border-[var(--lms-canvas-border)] pb-4 min-[768px]:grid-cols-2 min-[992px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Stage
    <Select name="stage" defaultValue={result.stage} className="block min-h-11 w-full min-[768px]:min-h-9">
     {stages.map(stage=><option key={stage} value={stage}>{stage}</option>)}
    </Select></label>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Name, roll, branch, batch, email, phone or role
    <Input type="search" name="search" defaultValue={result.search} maxLength={100} className="block min-h-11 w-full min-[768px]:min-h-9"/>
   </label>
   <Button type="submit" className="min-h-11 w-full min-[768px]:min-h-9 min-[992px]:w-auto">Preview filters</Button>
   <details className="group col-span-full" open={result.flag !== "ALL" || result.channel !== "ALL" || result.eligibility !== "ALL" || result.sort !== "NEWEST" || result.submittedWithin !== "ALL"}>
    <summary className="inline-flex min-h-11 cursor-pointer list-none items-center text-sm font-semibold text-[var(--lms-teal-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">Applicant flags · Channel · Eligibility evidence · Order by · Submitted window</summary>
    <div className="mt-3 grid min-w-0 gap-3 min-[768px]:grid-cols-2 min-[1280px]:grid-cols-5">
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Applicant flags
    <Select name="flag" defaultValue={result.flag} className="block min-h-11 w-full min-[768px]:min-h-9">
     <option value="ALL">Any flag</option><option value="WITHDRAWAL_REQUESTED">Withdrawal requested</option>
     <option value="NO_SHOW">No-show</option><option value="PLACED_ELSEWHERE">Accepted another offer</option>
     <option value="ADDED_BY_COLLEGE">Added by college</option>
    </Select></label>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Channel
    <Select name="channel" defaultValue={result.channel} className="block min-h-11 w-full min-[768px]:min-h-9">
     <option value="ALL">All</option><option value="INTERNAL">Internal</option><option value="EXTERNAL">External</option>
    </Select></label>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Eligibility evidence
    <Select name="eligibility" defaultValue={result.eligibility} className="block min-h-11 w-full min-[768px]:min-h-9">
     <option value="ALL">All</option><option value="ELIGIBLE">Eligible</option>
     <option value="ELIGIBLE_WITH_MISSING_EVIDENCE">Eligible · missing evidence</option>
    </Select></label>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Order by
    <Select name="sort" defaultValue={result.sort} className="block min-h-11 w-full min-[768px]:min-h-9">
     <option value="NEWEST">Recently submitted</option><option value="OLDEST">Earliest submitted</option>
     <option value="LEARNER_NAME">Learner name</option>
    </Select></label>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Submitted window
    <Select name="submittedWithin" defaultValue={result.submittedWithin} className="block min-h-11 w-full min-[768px]:min-h-9">
     <option value="ALL">Any date</option><option value="LAST_7_DAYS">Last 7 × 24h</option>
     <option value="LAST_30_DAYS">Last 30 × 24h</option>
    </Select></label>
    </div>
   </details>
  </form>
  <Banner tone="info">
   {result.rows.length} application records shown in this preview.
   {result.truncated?" More records exist; only the first 500 are shown in this preview. The download includes every match.":""}
   {" "}Each row represents an application, not necessarily a distinct learner.
  </Banner>
  {result.rows.length===0?<EmptyState title="No persisted applications match these filters."/>:
   <section aria-label="Applicant export preview" className="divide-y divide-border border-y border-border">
    {result.rows.map(row=><article key={row.applicationId} className="min-w-0 py-4">
     <h2 className="break-words font-semibold text-foreground">{row.studentName??"Name unavailable"}</h2>
     <p className="break-words text-sm text-body">{row.roleTitle} · {row.status} · {row.screeningStatus??"Screening unavailable"}</p>
     <p className="mt-1 break-words text-xs text-body">Channel: {row.channel} · Submitted {new Date(row.submittedAt).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"})} IST</p>
     <details className="group mt-3 min-w-0"><summary className="inline-flex min-h-11 cursor-pointer list-none items-center text-xs font-semibold text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">Academic evidence <span aria-hidden="true" className="ml-2">⌄</span></summary>
     <dl className="grid min-w-0 grid-cols-2 gap-3 text-xs text-body min-[768px]:grid-cols-4">
      <div><dt>Roll number</dt><dd className="font-semibold text-foreground">{row.rollNumber??"Not recorded"}</dd></div>
      <div><dt>Batch</dt><dd className="font-semibold text-foreground">{row.batchName??"Not recorded"}</dd></div>
      <div><dt>Branch</dt><dd className="font-semibold text-foreground">{row.branchName??"Not recorded"}</dd></div>
      <div><dt>Academic year</dt><dd className="font-semibold text-foreground">{row.academicYear??"Not recorded"}</dd></div>
      <div><dt>CGPA</dt><dd className="font-semibold text-foreground">{row.cgpaHundredths==null?"Not recorded":(row.cgpaHundredths/100).toFixed(2)}</dd></div>
      <div><dt>Active backlogs</dt><dd className="font-semibold text-foreground">{row.activeBacklogs??"Not recorded"}</dd></div>
      <div><dt>Past backlogs</dt><dd className="font-semibold text-foreground">{row.pastBacklogs??"Not recorded"}</dd></div>
      <div><dt>Academic evidence</dt><dd className="font-semibold text-foreground">{row.evidenceSource??"Not recorded"}</dd></div>
     </dl></details>
     {[row.pendingWithdrawal?"Withdrawal requested":null,row.noShow?"No-show":null,
       row.placedElsewhere?"Placed elsewhere":null,row.addedByCollege?"Added by college":null]
       .filter((value):value is string=>Boolean(value)).length>0?(
      <p className="mt-2 text-xs font-semibold text-body">
       {[row.pendingWithdrawal?"Withdrawal requested":null,row.noShow?"No-show":null,
         row.placedElsewhere?"Placed elsewhere":null,row.addedByCollege?"Added by college":null]
         .filter(Boolean).join(" · ")}
      </p>
     ):null}
    </article>)}
   </section>}
  <p className="text-xs text-body">The preview is limited to 500 rows. The full filtered CSV download is formula-neutralized and includes roll number and contact columns. Internal screening comments and staged results are not exported. Batch and branch reflect the learner’s current active academic enrollment.</p>
 </div>;
}
