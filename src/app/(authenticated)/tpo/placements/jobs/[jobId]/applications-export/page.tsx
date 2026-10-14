import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {hasMembershipRole} from "@/modules/identity/context";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {getTpoDriveApplicationsExport} from "@/modules/placements/tpo-drive-applications-export-service";
export default async function TpoApplicationsExportPage({params,searchParams}:{
 params:Promise<{jobId:string}>;searchParams:Promise<{stage?:string|string[];search?:string|string[];channel?:string|string[];eligibility?:string|string[]}>;
}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const {jobId}=await params;
 const filters=await searchParams;
 let result:Awaited<ReturnType<typeof getTpoDriveApplicationsExport>>;
 try{result=await getTpoDriveApplicationsExport(context,{...filters,jobId});}
 catch(error){if(error instanceof PlacementsServiceError&&error.code==="PLACEMENT_JOB_NOT_FOUND")notFound();throw error;}
 const ready=process.env.DB09_TPO_API_READY==="DB09_VERIFIED";
 const query=new URLSearchParams({stage:result.stage,search:result.search,channel:result.channel,eligibility:result.eligibility}).toString();
 const stages=["ALL","SUBMITTED","PENDING","HOLD","SHORTLISTED","REJECTED","WITHDRAWN"] as const;
 return <div className="space-y-6">
  <Link href={"/tpo/placements/jobs/"+jobId+"/applicants-pipeline?"+query} className="text-sm font-semibold text-primary-text hover:underline">← Applicants</Link>
  <PageHeader eyebrow="TPO · Export applicants" title={result.job.title+" · Applications"}
   description="Read-only college-scoped export preview without internal screening notes."
   actions={ready?<a href={"/api/placements/tpo/jobs/"+jobId+"/applications/export?"+query} download
    className="inline-flex min-h-10 items-center rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-on-primary">
     Download capped CSV</a>:null}/>
  <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
   <label className="min-w-40 flex-1 text-sm text-body">Stage
    <select name="stage" defaultValue={result.stage} className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface p-2">
     {stages.map(stage=><option key={stage} value={stage}>{stage}</option>)}
    </select></label>
   <label className="min-w-40 flex-1 text-sm text-body">Student or role
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
   <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Preview filters</button>
  </form>
  {!ready?<p role="status" className="rounded-xl border border-border bg-surface p-4 text-sm text-body">
   CSV download requires the DB09 verification gate.</p>:null}
  <p className="rounded-xl border border-border bg-surface p-4 text-sm text-body">
   {result.rows.length} application records shown.
   {result.truncated?" More records exist; only the first 500 are shown and exported.":""}
   {" "}Each row represents an application, not necessarily a distinct learner.
  </p>
  {result.rows.length===0?<p role="status" className="rounded-xl border border-border bg-surface p-4 text-sm text-body">
   No persisted applications match these filters.</p>:
   <section aria-label="Applicant export preview" className="grid gap-3">
    {result.rows.map(row=><article key={row.applicationId} className="rounded-xl border border-border bg-surface p-4">
     <h2 className="font-semibold text-foreground">{row.studentName??"Name unavailable"}</h2>
     <p className="text-sm text-body">{row.roleTitle} · {row.status} · {row.screeningStatus??"Screening unavailable"}</p>
     <p className="text-xs text-body">Channel: {row.channel} · Submitted {new Date(row.submittedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</p>
    </article>)}
   </section>}
  <p className="text-xs text-body">CSV is formula-neutralized and capped at 500, with an explicit TRUNCATED row when needed. It omits private screening comments and staged results.</p>
 </div>;
}
