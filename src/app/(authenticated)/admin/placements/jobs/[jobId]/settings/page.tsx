import {SuperAdminDriveTabs} from "@/components/placements/super-admin-drive-tabs";
import {SuperAdminDriveDeadline} from "@/components/placements/super-admin-drive-deadline";
import {SuperAdminDriveDuplicate} from "@/components/placements/super-admin-drive-duplicate";
import {SuperAdminDriveArchive} from "@/components/placements/super-admin-drive-archive";
import {SuperAdminPublishedDriveEdit} from "@/components/placements/super-admin-published-drive-edit";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { getCurrentRequestContext } from "@/auth/request-context";
import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
import { getPlacementJob } from "@/modules/placements/job-service";
import {driveSettingsIstDate} from "@/modules/placements/admin-drive-settings-date-model";
import { PageHeader } from "@/components/ui/page-header";
import { ThirdPartyLink } from "@/components/ui/third-party-link";
export default async function DriveSettingsPage({params}:{params:Promise<{jobId:string}>}){
 const {jobId}=await params;
 const context=await getCurrentRequestContext();
 requireSuperAdminSelectedCollege(context,"placements.manage");
 const job=await getPlacementJob(context,jobId);
 const base="/admin/placements/jobs/"+encodeURIComponent(jobId);
 return <div className="space-y-4">
    <SuperAdminDriveTabs jobId={jobId} active="Settings"/>
  <PageHeader eyebrow="Super Admin · Drive workspace" title="Settings" description="Drive status, deadline and policy controls for the selected college."/>
  <section className="space-y-2 border-b border-border pb-5">
   <h2 className="font-semibold">{job.title}</h2>
   <p className="flex flex-wrap items-center gap-2 text-sm text-body">Status: <StatusBadge tone={job.status==="PUBLISHED"?"success":job.status==="DRAFT"?"warning":"neutral"}>{job.status}</StatusBadge></p>
   <p className="text-sm text-body">Application deadline (IST): {job.applicationDeadline ? driveSettingsIstDate(job.applicationDeadline) : "Not configured"}</p>
   <p className="text-sm text-muted-foreground">The existing drive workspace enforces deadline, eligibility and publication state transitions.</p>
   <Link href={base} className="inline-flex min-h-11 items-center font-semibold text-primary-text">Open drive controls →</Link>
  </section>
  {job.status==="PUBLISHED"?
    <SuperAdminPublishedDriveEdit job={{
      id:job.id,title:job.title,description:job.description,
      locations:job.locations,applicationDeadline:job.applicationDeadline?.toISOString()??null,
      openings:job.openings,minCtc:job.minimumAnnualCtcInr,maxCtc:job.maximumAnnualCtcInr,
      updatedAt:job.updatedAt.toISOString(),
    }} />:null}
  {job.legacyPostingDetails?<section className="space-y-3 border-b border-border pb-5"
    aria-label="Additional job details">
    <h2 className="font-semibold">Additional job details</h2>
    <p className="text-xs text-muted-foreground">Informational posting terms; enforceable learner eligibility remains in the drive policy.</p>
    {job.legacyPostingDetails.responsibilities?<div>
      <h3 className="text-sm font-semibold">Responsibilities</h3>
      <p className="whitespace-pre-wrap text-sm text-body">{job.legacyPostingDetails.responsibilities}</p>
    </div>:null}
    {job.legacyPostingDetails.assessmentUrl?
      <p className="text-sm">Assessment URL: <ThirdPartyLink href={job.legacyPostingDetails.assessmentUrl}
        label={job.legacyPostingDetails.assessmentUrl} /></p>:null}
    {job.legacyPostingDetails.assessmentDeadline?<p className="text-sm">
      Assessment deadline (IST): {driveSettingsIstDate(job.legacyPostingDetails.assessmentDeadline)}
    </p>:null}
    {job.legacyPostingDetails.importantDates?.length?<div>
      <h3 className="text-sm font-semibold">Important dates</h3>
      <ul className="mt-2 space-y-1 text-sm">{job.legacyPostingDetails.importantDates.map((date,i)=>
        <li key={i}>{date.label}: {driveSettingsIstDate(date.at)}</li>)}</ul>
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
  <Link href="/admin/placements" className="inline-flex min-h-11 items-center font-semibold text-primary-text">Platform placement policy →</Link>
 </div>;
}