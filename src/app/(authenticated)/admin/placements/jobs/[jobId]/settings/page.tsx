import {SuperAdminDriveDeadline} from "@/components/placements/super-admin-drive-deadline";
import {SuperAdminDriveDuplicate} from "@/components/placements/super-admin-drive-duplicate";
import {SuperAdminDriveArchive} from "@/components/placements/super-admin-drive-archive";
import {SuperAdminPublishedDriveEdit} from "@/components/placements/super-admin-published-drive-edit";
import Link from "next/link";
import {SuperAdminDriveStatusControl} from "@/components/admin/super-admin-drive-status-control";
import {Banner} from "@/components/ui/banner";
import {ErrorState} from "@/components/ui/error-state";
import { getCurrentRequestContext } from "@/auth/request-context";
import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
import { getPlacementJob } from "@/modules/placements/job-service";
import {getJobEligibilityPolicy} from "@/modules/placements/eligibility-service";
import {listPlacementJobTypeChoices} from "@/modules/placements/tpo-configuration-read-service";
import {driveSettingsIstDate} from "@/modules/placements/admin-drive-settings-date-model";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { ThirdPartyLink } from "@/components/ui/third-party-link";
export default async function DriveSettingsPage({params}:{params:Promise<{jobId:string}>}){
 const {jobId}=await params;
 const context=await getCurrentRequestContext();
 const base="/admin/placements/jobs/"+encodeURIComponent(jobId);
 if(!context.adminScope?.collegeId)
  return <div className="min-w-0 space-y-5">
   <PageHeader title="Settings"/>
   <Banner tone="warning">Select a college to continue. Choose the correct college in the Super Admin scope selector before editing this drive.</Banner>
   <PageBackLink href="/admin/placements/drives" label="Back to drives"/>
  </div>;
 requireSuperAdminSelectedCollege(context,"placements.manage");
 if(!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(jobId))
  return <div className="min-w-0 space-y-5">
   <PageHeader title="Settings"/>
   <ErrorState title="Invalid drive" description="Select a valid drive from this college."
    action={<PageBackLink href="/admin/placements/drives" label="Back to drives"/>}/>
  </div>;
 let job:Awaited<ReturnType<typeof getPlacementJob>>;
 try{job=await getPlacementJob(context,jobId);}
 catch{
  return <div className="min-w-0 space-y-5">
   <PageHeader title="Settings"/>
   <ErrorState title="Failed to load drive settings"
    description="The selected college's job details could not be verified. No changes have been made."
    action={<div className="flex flex-wrap gap-3">
     <Link href={base+"/settings"} className="font-semibold text-primary-text underline">Retry settings</Link>
     <PageBackLink href="/admin/placements/drives" label="Back to drives"/>
    </div>}/>
  </div>;
 }
 const [policyRead,typesRead]=job.status==="PUBLISHED"?await Promise.allSettled([
  getJobEligibilityPolicy(context,jobId),
  listPlacementJobTypeChoices(context,job.collegeId),
 ]):[null,null];
 const publishedPolicy=policyRead?.status==="fulfilled"?policyRead.value:null;
 const publishedJobTypes=typesRead?.status==="fulfilled"?typesRead.value:[];
 const publishedEditReady=publishedPolicy!==null&&typesRead?.status==="fulfilled";
 return <div className="min-w-0 space-y-4 md:space-y-6">
    
  <PageHeader title="Settings" description="Drive status, deadline and policy controls for the selected college."
   actions={<PageBackLink href={base} label="Drive overview"/>}/>
  <section aria-label="Job details" className="min-w-0 space-y-[var(--lms-space-2)] border-b border-border pb-[var(--lms-space-4)]">
   <h2 className="break-words text-[var(--lms-font-lg)] font-semibold leading-7 text-[var(--lms-heading)]">{job.title}</h2>
   <p className="text-sm text-body">Application deadline (IST): {job.applicationDeadline ? driveSettingsIstDate(job.applicationDeadline) : "Not configured"}</p>
   <p className="text-sm text-muted-foreground">The existing drive workspace enforces deadline, eligibility and publication state transitions.</p>
  </section>
  <section aria-label="Edit drive" className="min-w-0 space-y-3">
   <h2 className="text-lg font-semibold text-[var(--lms-heading)]">Edit drive</h2>
   {job.status==="DRAFT"?<Banner tone="info">
    Full draft form and learner eligibility controls are available from the drive overview. Keep them together so a partially saved policy is never mistaken for one atomic update.
    {" "}<Link href={base} className="font-semibold underline">Edit draft details →</Link>
   </Banner>:null}
   {job.status==="PUBLISHED"?
    <SuperAdminPublishedDriveEdit
     sourceReady={publishedEditReady}
     jobTypes={publishedJobTypes}
     job={{
      id:job.id,title:job.title,description:job.description,
      locations:job.locations,applicationDeadline:job.applicationDeadline?.toISOString()??null,
      openings:job.openings,minCtc:job.minimumAnnualCtcInr,maxCtc:job.maximumAnnualCtcInr,
      updatedAt:job.updatedAt.toISOString(),
      jobTypeLabel:job.jobTypeLabel??"",employmentType:job.employmentType,
      workMode:job.workMode,responsibilities:job.legacyPostingDetails?.responsibilities??"",
      targeting:publishedPolicy?{
       programs:publishedPolicy.allowedProgramIds.length,
       cohorts:publishedPolicy.allowedCohortIds.length,
       sections:publishedPolicy.allowedSectionIds.length,
      }:null,
    }} />:null}
  </section>
  {job.legacyPostingDetails?<details className="min-w-0 space-y-[var(--lms-space-3)] border-b border-border pb-[var(--lms-space-4)]"
    aria-label="Additional job details">
    <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Additional job details</summary>
    <div className="min-w-0 space-y-[var(--lms-space-3)] pt-[var(--lms-space-2)]">
    <p className="text-xs text-muted-foreground">Informational posting terms; enforceable learner eligibility remains in the drive policy.</p>
    {job.legacyPostingDetails.responsibilities?<div>
      <h3 className="text-sm font-semibold leading-6 text-[var(--lms-heading)]">Responsibilities</h3>
      <p className="whitespace-pre-wrap text-sm text-body">{job.legacyPostingDetails.responsibilities}</p>
    </div>:null}
    {job.legacyPostingDetails.assessmentUrl?
      <p className="text-sm">Assessment URL: <ThirdPartyLink href={job.legacyPostingDetails.assessmentUrl}
        label={job.legacyPostingDetails.assessmentUrl} /></p>:null}
    {job.legacyPostingDetails.assessmentDeadline?<p className="text-sm">
      Assessment deadline (IST): {driveSettingsIstDate(job.legacyPostingDetails.assessmentDeadline)}
    </p>:null}
    {job.legacyPostingDetails.importantDates?.length?<div>
      <h3 className="text-sm font-semibold leading-6 text-[var(--lms-heading)]">Important dates</h3>
      <ul className="mt-2 space-y-1 text-sm">{job.legacyPostingDetails.importantDates.map((date,i)=>
        <li key={i}>{date.label}: {driveSettingsIstDate(date.at)}</li>)}</ul>
    </div>:null}
    {job.legacyPostingDetails.customEligibilityRules?.length?<div>
      <h3 className="text-sm font-semibold leading-6 text-[var(--lms-heading)]">Custom eligibility rules (informational)</h3>
      <ul className="mt-2 space-y-1 text-sm">{job.legacyPostingDetails.customEligibilityRules.map((rule,i)=>
        <li key={i}>{rule.label}: {rule.value}</li>)}</ul>
    </div>:null}
    </div>
  </details>:null}
  {job.status==="PUBLISHED"?<SuperAdminDriveDeadline jobId={jobId} deadline={job.applicationDeadline?.toISOString()??null}/>:null}
  <SuperAdminDriveStatusControl jobId={job.id} status={job.status}/>
  <section aria-label="Duplicate drive" className="min-w-0 space-y-3 border-b border-border pb-4">
   <h2 className="text-lg font-semibold text-[var(--lms-heading)]">Duplicate</h2>
   <SuperAdminDriveDuplicate jobId={jobId} title={job.title}/>
  </section>
  {job.status!=="ARCHIVED"?<section aria-label="Danger zone"
   className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[#ffccc7] bg-[#fff1f0] p-4">
   <h2 className="text-lg font-semibold text-[#cf1322]">Danger zone</h2>
   <p className="text-sm text-[#7f1d1d]">Deleting archives this drive; existing application and decision records remain retained. Review the impact and reason before confirming.</p>
   <SuperAdminDriveArchive jobId={jobId} title={job.title}/>
  </section>:null}
  <Link href="/admin/placements" className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline hover:text-[var(--lms-primary-text)] md:min-h-9 active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Platform placement policy →</Link>
 </div>;
}