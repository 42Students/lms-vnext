import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {hasMembershipRole} from "@/modules/identity/context";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {getTpoDriveApplicationsExport} from "@/modules/placements/tpo-drive-applications-export-service";
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
 return <div className="space-y-6">
  <Link href={"/tpo/placements/jobs/"+jobId+"/applicants-pipeline?"+query} className="text-sm font-semibold text-primary-text hover:underline">← Applicants</Link>
  <PageHeader eyebrow="TPO · Export applicants" title={result.job.title+" · Applications"}
   description="Read-only college-scoped export preview without internal screening notes."
   actions={<a href={"/api/placements/tpo/jobs/"+jobId+"/applications/export?"+query} download
    className="inline-flex min-h-10 items-center rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-on-primary">
     Download all matching CSV</a>}/>
  <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
   <label className="min-w-40 flex-1 text-sm text-body">Stage
    <select name="stage" defaultValue={result.stage} className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface p-2">
     {stages.map(stage=><option key={stage} value={stage}>{stage}</option>)}
    </select></label>
   <label className="min-w-40 flex-1 text-sm text-body">Applicant flags
    <select name="flag" defaultValue={result.flag} className="mt-1 min-h-11 w-full rounded border border-border bg-surface p-2">
     <option value="ALL">Any flag</option><option value="WITHDRAWAL_REQUESTED">Withdrawal requested</option>
     <option value="NO_SHOW">No-show</option><option value="PLACED_ELSEWHERE">Accepted another offer</option>
     <option value="ADDED_BY_COLLEGE">Added by college</option>
    </select></label>
   <label className="min-w-40 flex-1 text-sm text-body">Name, roll, branch, batch, email, phone or role
    <input name="search" defaultValue={result.search} maxLength={100} className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface p-2"/>
   </label>
   <label className="min-w-32 flex-1 text-sm text-body">Channel
    <select name="channel" defaultValue={result.channel} className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface p-2">
     <option value="ALL">All</option><option value="INTERNAL">Internal</option><option value="EXTERNAL">External</option>
    </select></label>
   <label className="min-w-40 flex-1 text-sm text-body">Eligibility evidence
    <select name="eligibility" defaultValue={result.eligibility} className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface p-2">
     <option value="ALL">All</option><option value="ELIGIBLE">Eligible</option>
     <option value="ELIGIBLE_WITH_MISSING_EVIDENCE">Eligible · missing evidence</option>
    </select></label>
   <label className="min-w-32 flex-1 text-sm text-body">Order by
    <select name="sort" defaultValue={result.sort} className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface p-2">
     <option value="NEWEST">Recently submitted</option><option value="OLDEST">Earliest submitted</option>
     <option value="LEARNER_NAME">Learner name</option>
    </select></label>
   <label className="min-w-36 flex-1 text-sm text-body">Submitted window
    <select name="submittedWithin" defaultValue={result.submittedWithin} className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface p-2">
     <option value="ALL">Any date</option><option value="LAST_7_DAYS">Last 7 × 24h</option>
     <option value="LAST_30_DAYS">Last 30 × 24h</option>
    </select></label>
   <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Preview filters</button>
  </form>
  <p className="rounded-xl border border-border bg-surface p-4 text-sm text-body">
   {result.rows.length} application records shown in this preview.
   {result.truncated?" More records exist; only the first 500 are shown in this preview. The download includes every match.":""}
   {" "}Each row represents an application, not necessarily a distinct learner.
  </p>
  {result.rows.length===0?<p role="status" className="rounded-xl border border-border bg-surface p-4 text-sm text-body">
   No persisted applications match these filters.</p>:
   <section aria-label="Applicant export preview" className="grid gap-3">
    {result.rows.map(row=><article key={row.applicationId} className="rounded-xl border border-border bg-surface p-4">
     <h2 className="font-semibold text-foreground">{row.studentName??"Name unavailable"}</h2>
     <p className="text-sm text-body">{row.roleTitle} · {row.status} · {row.screeningStatus??"Screening unavailable"}</p>
     <p className="text-xs text-body">Channel: {row.channel} · Submitted {new Date(row.submittedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</p>
     <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-body sm:grid-cols-4">
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
