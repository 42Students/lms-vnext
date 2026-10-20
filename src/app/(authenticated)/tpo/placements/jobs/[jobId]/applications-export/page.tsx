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
  <Link href={"/tpo/placements/jobs/"+jobId+"/applicants-pipeline?"+query} className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-link-text)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">← Applicants</Link>
  <PageHeader eyebrow="TPO · Export applicants" title={result.job.title+" · Applications"}
   description="Read-only college-scoped export preview without internal screening notes."
   actions={<a href={"/api/placements/tpo/jobs/"+jobId+"/applications/export?"+query} download
    className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary md:min-h-9">
     Download all matching CSV</a>}/>
  <form method="get" className="flex min-w-0 flex-wrap items-end gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
   <label className="min-w-40 flex-1 text-sm text-body">Stage
    <Select name="stage" defaultValue={result.stage} className="mt-1 w-full">
     {stages.map(stage=><option key={stage} value={stage}>{stage}</option>)}
    </Select></label>
   <label className="min-w-40 flex-1 text-sm text-body">Applicant flags
    <Select name="flag" defaultValue={result.flag} className="mt-1 w-full">
     <option value="ALL">Any flag</option><option value="WITHDRAWAL_REQUESTED">Withdrawal requested</option>
     <option value="NO_SHOW">No-show</option><option value="PLACED_ELSEWHERE">Accepted another offer</option>
     <option value="ADDED_BY_COLLEGE">Added by college</option>
    </Select></label>
   <label className="min-w-40 flex-1 text-sm text-body">Name, roll, branch, batch, email, phone or role
    <Input name="search" defaultValue={result.search} maxLength={100} className="mt-1 w-full"/>
   </label>
   <label className="min-w-32 flex-1 text-sm text-body">Channel
    <Select name="channel" defaultValue={result.channel} className="mt-1 w-full">
     <option value="ALL">All</option><option value="INTERNAL">Internal</option><option value="EXTERNAL">External</option>
    </Select></label>
   <label className="min-w-40 flex-1 text-sm text-body">Eligibility evidence
    <Select name="eligibility" defaultValue={result.eligibility} className="mt-1 w-full">
     <option value="ALL">All</option><option value="ELIGIBLE">Eligible</option>
     <option value="ELIGIBLE_WITH_MISSING_EVIDENCE">Eligible · missing evidence</option>
    </Select></label>
   <label className="min-w-32 flex-1 text-sm text-body">Order by
    <Select name="sort" defaultValue={result.sort} className="mt-1 w-full">
     <option value="NEWEST">Recently submitted</option><option value="OLDEST">Earliest submitted</option>
     <option value="LEARNER_NAME">Learner name</option>
    </Select></label>
   <label className="min-w-36 flex-1 text-sm text-body">Submitted window
    <Select name="submittedWithin" defaultValue={result.submittedWithin} className="mt-1 w-full">
     <option value="ALL">Any date</option><option value="LAST_7_DAYS">Last 7 × 24h</option>
     <option value="LAST_30_DAYS">Last 30 × 24h</option>
    </Select></label>
   <Button type="submit" >Preview filters</Button>
  </form>
  <Banner tone="info">
   {result.rows.length} application records shown in this preview.
   {result.truncated?" More records exist; only the first 500 are shown in this preview. The download includes every match.":""}
   {" "}Each row represents an application, not necessarily a distinct learner.
  </Banner>
  {result.rows.length===0?<EmptyState title="No persisted applications match these filters."/>:
   <section aria-label="Applicant export preview" className="grid gap-3">
    {result.rows.map(row=><article key={row.applicationId} className="border-b border-border py-4">
     <h2 className="font-semibold text-foreground">{row.studentName??"Name unavailable"}</h2>
     <p className="text-sm text-body">{row.roleTitle} · {row.status} · {row.screeningStatus??"Screening unavailable"}</p>
     <p className="text-xs text-body">Channel: {row.channel} · Submitted {new Date(row.submittedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</p>
     <dl className="mt-3 grid min-w-0 grid-cols-2 gap-[var(--lms-space-2)] text-xs text-body min-[768px]:grid-cols-4">
      <div><dt>Roll number</dt><dd className="font-semibold text-foreground">{row.rollNumber??"Not recorded"}</dd></div>
      <div><dt>Batch</dt><dd className="font-semibold text-foreground">{row.batchName??"Not recorded"}</dd></div>
      <div><dt>Branch</dt><dd className="font-semibold text-foreground">{row.branchName??"Not recorded"}</dd></div>
      <div><dt>Academic year</dt><dd className="font-semibold text-foreground">{row.academicYear??"Not recorded"}</dd></div>
      <div><dt>CGPA</dt><dd className="font-semibold text-foreground">{row.cgpaHundredths==null?"Not recorded":(row.cgpaHundredths/100).toFixed(2)}</dd></div>
      <div><dt>Active backlogs</dt><dd className="font-semibold text-foreground">{row.activeBacklogs??"Not recorded"}</dd></div>
      <div><dt>Past backlogs</dt><dd className="font-semibold text-foreground">{row.pastBacklogs??"Not recorded"}</dd></div>
      <div><dt>Academic evidence</dt><dd className="font-semibold text-foreground">{row.evidenceSource??"Not recorded"}</dd></div>
     </dl>
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
