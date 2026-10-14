import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {hasMembershipRole} from "@/modules/identity/context";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {getTpoDriveApplicationsExport} from "@/modules/placements/tpo-drive-applications-export-service";
export default async function TpoApplicationsExportPage({params}:{params:Promise<{jobId:string}>}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const {jobId}=await params;
 let result:Awaited<ReturnType<typeof getTpoDriveApplicationsExport>>;
 try{result=await getTpoDriveApplicationsExport(context,{jobId});}
 catch(error){if(error instanceof PlacementsServiceError&&error.code==="PLACEMENT_JOB_NOT_FOUND")notFound();throw error;}
 const ready=process.env.DB09_TPO_API_READY==="DB09_VERIFIED";
 return <div className="space-y-6">
  <Link href={"/tpo/placements/jobs/"+jobId+"/applicants-pipeline"} className="text-sm font-semibold text-primary-text hover:underline">← Applicants</Link>
  <PageHeader eyebrow="TPO · Export applicants" title={result.job.title+" · Applications"}
   description="Read-only college-scoped export preview without internal screening notes."
   actions={ready?<a href={"/api/placements/tpo/jobs/"+jobId+"/applications/export"}
    className="inline-flex min-h-10 items-center rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-on-primary">
     Download capped CSV</a>:null}/>
  {!ready?<p role="status" className="rounded-xl border border-border bg-surface p-4 text-sm text-body">
   CSV download requires the DB09 verification gate.</p>:null}
  <p className="rounded-xl border border-border bg-surface p-4 text-sm text-body">
   {result.rows.length} application records shown.
   {result.truncated?" More records exist; only the first 500 are shown and exported.":""}
   {" "}Each row represents an application, not necessarily a distinct learner.
  </p>
  {result.rows.length===0?<p role="status" className="rounded-xl border border-border bg-surface p-4 text-sm text-body">
   No persisted applications in this drive.</p>:
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
