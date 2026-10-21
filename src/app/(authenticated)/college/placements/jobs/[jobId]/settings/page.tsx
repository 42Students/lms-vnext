import Link from "next/link";
import {ErrorState} from "@/components/ui/error-state";
import {Tabs} from "@/components/ui/tabs";
import {AuthorizationError} from "@/modules/permissions/policy";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {PageHeader} from "@/components/ui/page-header";
import {Alert} from "@/components/ui/alert";
import {getCollegeDriveOverview} from "@/modules/placements/college-drive-overview-service";
import {CollegeLegacyDriveSettings} from "@/components/placements/college-legacy-drive-settings";
import {CollegeDriveArchiveAction} from "@/components/placements/college-drive-archive-action";
import {PlacementDraftEditForm} from "@/components/placements/placement-draft-edit-form";
import {listPlacementJobTypeChoices} from "@/modules/placements/tpo-configuration-read-service";
import {listPrograms} from "@/modules/academics/program-service";
import {listCohorts} from "@/modules/academics/cohort-service";
import {getPlacementJob} from "@/modules/placements/job-service";
import {getJobEligibilityPolicy} from "@/modules/placements/eligibility-service";
import type {CollegeLegacyDriveStatus} from "@/modules/placements/college-legacy-drive-settings-model";
import { Disclosure } from "@/components/ui/disclosure";

export default async function CollegeDriveSettingsPage({
  params,
}:{params:Promise<{jobId:string}>}) {
  const context=await getCurrentRequestContext();
  if(!context.membership||!hasMembershipRole(context,"COLLEGE_ADMIN")){
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Settings"/>
      <ErrorState title="Admin not assigned to a college"
        description="Contact your administrator to assign the College Admin role before managing placement jobs."
        action={<Link href="/dashboard"
          className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Back to dashboard</Link>}/>
    </div>;
  }
  const {jobId}=await params;
  const base="/college/placements/jobs/"+encodeURIComponent(jobId);
  const [overviewResult,jobResult]=await Promise.allSettled([
    getCollegeDriveOverview(context,jobId),
    getPlacementJob(context,jobId),
  ]);
  if(jobResult.status==="rejected"){
    if(jobResult.reason instanceof AuthorizationError)throw jobResult.reason;
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Settings"/>
      <ErrorState title="Drive details could not be loaded"
        description="The drive could not be verified. Editing is disabled until the latest record is available."
        action={<Link href={base+"/settings"} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry</Link>}/>
    </div>;
  }
  if(overviewResult.status==="rejected"&&overviewResult.reason instanceof AuthorizationError)
    throw overviewResult.reason;
  const job=jobResult.value;
  const drive=overviewResult.status==="fulfilled"?overviewResult.value.drive:null;
  const setup=job.status==="DRAFT"?await Promise.all([
    getJobEligibilityPolicy(context,jobId),
    listPrograms(context,job.collegeId),
    listPlacementJobTypeChoices(context,job.collegeId),
  ]).catch(()=>null):null;
  const cohortGroups=setup?await Promise.all(
    setup[1].map(async program=>({program,cohorts:await listCohorts(context,program.id)})),
  ).catch(()=>null):null;
  const eligibilityPolicy=setup?.[0]??null;
  const programs=setup?.[1]??[];
  const jobTypes=setup?.[2]??[];
  return <div className="min-w-0 space-y-[var(--lms-space-4)]">
    <PageHeader title="Settings" description={drive?.title??job.title}
      actions={<Link className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9"
        href={base+"/overview"}>Overview</Link>}/>
    <Tabs ariaLabel="Drive sections" renderPanel={false} value="settings"
      items={[
        {value:"overview",label:"Overview",href:base+"/overview"},
        {value:"applications",label:"Applications",href:base+"/applications"},
        {value:"schedule",label:"Schedule",href:base+"/interviews"},
        {value:"settings",label:"Settings",href:base+"/settings"},
      ]}/>
    {!drive?<Alert tone="warning">
      Applicant impact could not be verified. Review the drive overview before any high-impact lifecycle action.
      <Link href={base+"/settings"} className="ml-2 font-semibold text-link underline">Retry</Link>
    </Alert>:null}
    <section aria-label="Linked company" className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-3)]">
      <h2 className="text-[16px] font-semibold text-[var(--lms-heading)]">Company</h2>
      <p className="mt-1 text-sm text-body">{drive?.companyName??"Company association unavailable"}</p>
      <p className="mt-1 text-xs text-muted-foreground">The company relationship is college-scoped.
        It cannot be replaced by free-text editing on this page; manage verified company relationships
        in the placement operations workspace before creating a replacement draft.</p>
      {!drive?<Alert tone="info">Company matching could not be verified. Check the Companies directory; do not save an unlinked name.</Alert>:null}
    </section>
    {job.status==="DRAFT"&&eligibilityPolicy&&cohortGroups?
      <section aria-label="Edit drive" className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
        <PlacementDraftEditForm jobTypes={jobTypes} academicOptions={{
          programs:programs.map(program=>({
            id:program.id,name:program.name,code:program.code,departmentName:program.departmentName,
          })),
          cohorts:cohortGroups.flatMap(({program,cohorts})=>cohorts
            .filter(cohort=>cohort.status!=="ARCHIVED")
            .map(cohort=>({
              id:cohort.id,name:cohort.name,code:cohort.code,
              programId:program.id,programName:program.name,status:cohort.status,
            }))),
        }} value={{job:{
          id:job.id,title:job.title,description:job.description,
          employmentType:job.employmentType as "FULL_TIME"|"INTERNSHIP"|"CONTRACT",
          jobTypeLabel:job.jobTypeLabel,
          workMode:job.workMode as "ONSITE"|"HYBRID"|"REMOTE",
          locations:job.locations,openings:job.openings,
          minimumAnnualCtcInr:job.minimumAnnualCtcInr,
          maximumAnnualCtcInr:job.maximumAnnualCtcInr,
          applicationMode:job.applicationMode as "INTERNAL"|"HYBRID"|"EXTERNAL_ONLY",
          externalApplicationUrl:job.externalApplicationUrl,
          applicationDeadline:job.applicationDeadline?.toISOString()??null,
        },policy:{
          allowedProgramIds:eligibilityPolicy.allowedProgramIds,
          allowedCohortIds:eligibilityPolicy.allowedCohortIds,
          minCgpa:eligibilityPolicy.minCgpa,
          maxActiveBacklogs:eligibilityPolicy.maxActiveBacklogs,
          maxPastBacklogs:eligibilityPolicy.maxPastBacklogs,
          minTenthPercentage:eligibilityPolicy.minTenthPercentage,
          minTwelfthPercentage:eligibilityPolicy.minTwelfthPercentage,
          minDiplomaPercentage:eligibilityPolicy.minDiplomaPercentage,
          minUndergraduatePercentage:eligibilityPolicy.minUndergraduatePercentage,
          maxGapYears:eligibilityPolicy.maxGapYears,
          allowedPassingYears:eligibilityPolicy.allowedPassingYears,
          missingEvidencePolicy:eligibilityPolicy.missingEvidencePolicy as "ALLOW_WITH_FLAG"|"REQUIRE_COMPLETE",
        }}}/>
      </section>:
      <Alert tone={job.status==="DRAFT"?"warning":"info"}>
        {job.status==="DRAFT"
          ?"Drive changes were not saved. Required academic or policy options could not be verified; retry before editing."
          :"This drive is read-only. Only drafts in an active placement season are editable. Published-drive changes use the guarded lifecycle and deadline actions."}
      </Alert>}
    <section aria-label="Legacy drive settings" className="min-w-0">
      <CollegeLegacyDriveSettings jobId={jobId} status={(drive?.status??job.status) as CollegeLegacyDriveStatus}/>
    </section>
    {(drive?.status??job.status)!=="ARCHIVED"?<Disclosure title="Delete drive" className="min-w-0 border-b border-[var(--lms-canvas-border)]"><div className="min-w-0 pt-[var(--lms-space-2)]"><CollegeDriveArchiveAction jobId={jobId}/></div></Disclosure>:null}
  </div>;
}
