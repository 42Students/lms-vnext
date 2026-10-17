import {SuperAdminDriveTabs} from "@/components/placements/super-admin-drive-tabs";
import {SuperAdminDriveDeadline} from "@/components/placements/super-admin-drive-deadline";
import {SuperAdminDriveDuplicate} from "@/components/placements/super-admin-drive-duplicate";
import {SuperAdminDriveArchive} from "@/components/placements/super-admin-drive-archive";
import {SuperAdminPublishedDriveEdit} from "@/components/placements/super-admin-published-drive-edit";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getPlacementJob } from "@/modules/placements/job-service";
import { PageHeader } from "@/components/ui/page-header";
export default async function DriveSettingsPage({params}:{params:Promise<{jobId:string}>}){
 const {jobId}=await params;
 const context=await getCurrentRequestContext();
 const job=await getPlacementJob(context,jobId);
 const base="/admin/placements/jobs/"+encodeURIComponent(jobId);
 return <div className="space-y-4">
    <SuperAdminDriveTabs jobId={jobId} active="Settings"/>
  <PageHeader eyebrow="Super Admin · Drive workspace" title="Settings" description="Drive status, deadline and policy controls for the selected college."/>
  <section className="space-y-2 rounded-xl border border-border bg-surface p-5">
   <h2 className="font-semibold">{job.title}</h2>
   <p className="text-sm text-body">Status: {job.status}</p>
   <p className="text-sm text-body">Application deadline: {job.applicationDeadline?.toISOString().slice(0,10)??"Not configured"}</p>
   <p className="text-sm text-muted-foreground">The existing drive workspace enforces deadline, eligibility and publication state transitions.</p>
   <Link href={base} className="inline-flex min-h-10 items-center font-semibold text-primary-text">Open drive controls →</Link>
  </section>
  {job.status==="PUBLISHED"?
    <SuperAdminPublishedDriveEdit job={{
      id:job.id,title:job.title,description:job.description,
      locations:job.locations,applicationDeadline:job.applicationDeadline?.toISOString()??null,
      openings:job.openings,minCtc:job.minimumAnnualCtcInr,maxCtc:job.maximumAnnualCtcInr,
      updatedAt:job.updatedAt.toISOString(),
    }} />:null}
  {job.legacyPostingDetails?<section className="space-y-3 rounded-xl border border-border bg-surface p-5"
    aria-label="Additional job details">
    <h2 className="font-semibold">Additional job details</h2>
    <p className="text-xs text-muted-foreground">Informational posting terms; enforceable learner eligibility remains in the drive policy.</p>
    {job.legacyPostingDetails.responsibilities?<div>
      <h3 className="text-sm font-semibold">Responsibilities</h3>
      <p className="whitespace-pre-wrap text-sm text-body">{job.legacyPostingDetails.responsibilities}</p>
    </div>:null}
    {job.legacyPostingDetails.assessmentUrl?
      <p className="text-sm">Assessment URL: <a href={job.legacyPostingDetails.assessmentUrl}
        target="_blank" rel="noopener noreferrer" className="break-all text-primary-text underline">
        {job.legacyPostingDetails.assessmentUrl}</a></p>:null}
    {job.legacyPostingDetails.assessmentDeadline?<p className="text-sm">
      Assessment deadline (IST): {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",
        timeZone:"Asia/Kolkata"}).format(new Date(job.legacyPostingDetails.assessmentDeadline))}
    </p>:null}
    {job.legacyPostingDetails.importantDates?.length?<div>
      <h3 className="text-sm font-semibold">Important dates</h3>
      <ul className="mt-2 space-y-1 text-sm">{job.legacyPostingDetails.importantDates.map((date,i)=>
        <li key={i}>{date.label}: {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",
          timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(date.at))}</li>)}</ul>
    </div>:null}
    {job.legacyPostingDetails.customEligibilityRules?.length?<div>
      <h3 className="text-sm font-semibold">Custom eligibility rules (informational)</h3>
      <ul className="mt-2 space-y-1 text-sm">{job.legacyPostingDetails.customEligibilityRules.map((rule,i)=>
        <li key={i}>{rule.label}: {rule.value}</li>)}</ul>
    </div>:null}
  </section>:null}
  <SuperAdminDriveDuplicate jobId={jobId} title={job.title}/>
  {job.status!=="ARCHIVED"?<SuperAdminDriveArchive jobId={jobId} title={job.title}/>:null}
  {job.status==="PUBLISHED"?<SuperAdminDriveDeadline jobId={jobId} deadline={job.applicationDeadline?.toISOString()??null}/>:null}
  <Link href="/admin/placements" className="inline-flex min-h-10 items-center font-semibold text-primary-text">Platform placement policy →</Link>
 </div>;
}