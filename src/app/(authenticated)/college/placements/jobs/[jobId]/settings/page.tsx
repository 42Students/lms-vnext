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
import {listSections} from "@/modules/academics/section-service";
import {getPlacementJob} from "@/modules/placements/job-service";
import {getJobEligibilityPolicy} from "@/modules/placements/eligibility-service";
import type {CollegeLegacyDriveStatus} from "@/modules/placements/college-legacy-drive-settings-model";
import { Disclosure } from "@/components/ui/disclosure";
import { CollegeDriveSettingsDirtyGuard } from "@/components/placements/college-drive-settings-dirty-guard";
import {listCollegeCompanyDirectory} from "@/modules/placements/college-company-directory-service";
import {CollegeDraftCompanyPicker} from "@/components/placements/college-draft-company-picker";

export default async function CollegeDriveSettingsPage({
  params,searchParams,
}:{params:Promise<{jobId:string}>;
 searchParams:Promise<Record<string,string|string[]|undefined>>}) {
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
  const rawReturn=(await searchParams).returnTo;
  const returnTo=typeof rawReturn==="string"&&
    /^\/college\/placements\/drives(?:\?(?!\/)[^#]*)?$/.test(rawReturn)
    ?rawReturn:"/college/placements/drives";
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
  // Independent failures must not conceal the last saved drive details.
  // A draft remains non-editable until *all* required authoring choices load.
  const setupResults=job.status==="DRAFT"?await Promise.allSettled([
    getJobEligibilityPolicy(context,jobId),
    listPrograms(context,job.collegeId),
    listPlacementJobTypeChoices(context,job.collegeId),
  ]):null;
  const eligibilityPolicy=setupResults?.[0]?.status==="fulfilled"?setupResults[0].value:null;
  const programs=setupResults?.[1]?.status==="fulfilled"?setupResults[1].value:[];
  const jobTypes=setupResults?.[2]?.status==="fulfilled"?setupResults[2].value:[];
  const setupReady=Boolean(setupResults?.every(row=>row.status==="fulfilled"));
  const cohortResults=setupReady?await Promise.allSettled(
    programs.map(async program=>({program,cohorts:await listCohorts(context,program.id)})),
  ):null;
  const cohortGroups=cohortResults?.every(row=>row.status==="fulfilled")
    ?cohortResults.map(row=>row.status==="fulfilled"?row.value:null).filter(
       (row):row is {program:typeof programs[number];cohorts:Awaited<ReturnType<typeof listCohorts>>}=>row!==null)
    :null;
  const sectionResults=cohortGroups?await Promise.allSettled(
    cohortGroups.flatMap(({program,cohorts})=>cohorts
      .filter(cohort=>cohort.status!=="ARCHIVED")
      .map(async cohort=>({program,cohort,sections:await listSections(context,cohort.id)}))),
  ):null;
  const sectionGroups=sectionResults?.every(row=>row.status==="fulfilled")
    ?sectionResults.map(row=>row.status==="fulfilled"?row.value:null).filter(
       (row):row is {program:typeof programs[number];cohort:Awaited<ReturnType<typeof listCohorts>>[number];sections:Awaited<ReturnType<typeof listSections>>}=>row!==null)
    :null;
  // Draft companies must be selected from a persisted, active college
  // relationship; free-typed labels cannot mutate a canonical company ID.
  const companyChoices=job.status==="DRAFT"
    ?await listCollegeCompanyDirectory(context,{
      q:"",page:1,pageSize:100,status:"ACTIVE",sort:"COMPANY",
     }).catch(()=>null):null;
  const applicationCount=overviewResult.status==="fulfilled"
    ?overviewResult.value.counts.applications:null;
  return <CollegeDriveSettingsDirtyGuard className="min-w-0 space-y-[var(--lms-space-4)]">
    <nav aria-label="Drive breadcrumb" className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <Link href={returnTo} className="inline-flex min-h-9 items-center font-semibold text-link underline">Drives</Link>
      <span aria-hidden="true">/</span><span className="min-w-0 truncate">{drive?.companyName??drive?.title??job.title}</span>
      <span aria-hidden="true">/</span><span aria-current="page">Settings</span>
    </nav>
    <PageHeader title="Settings" description={drive?.title??job.title}
      actions={<div className="flex flex-wrap items-center gap-3">
        <Link className="inline-flex min-h-9 items-center font-semibold text-link underline"
         href={base+"/settings"}>Refresh</Link>
        <Link className="inline-flex min-h-9 items-center font-semibold text-link underline"
         href={base+"/overview"}>Overview</Link>
      </div>}/>
    <Tabs ariaLabel="Drive sections" renderPanel={false} value="settings"
      items={[
        {value:"overview",label:"Overview",href:base+"/overview"},
        {value:"applications",label:"Applications",href:base+"/applications"},
        {value:"schedule",label:"Schedule",href:base+"/interviews"},
        {value:"settings",label:"Settings",href:base+"/settings"},
      ]}/>
    <div className="flex min-w-0 flex-wrap items-center gap-3 border-b border-[var(--lms-canvas-border)] pb-3 text-sm">
      <span className="font-semibold text-[var(--lms-heading)]">Applicant impact</span>
      {typeof applicationCount==="number"?
        <span>{applicationCount} total application{applicationCount===1?"":"s"}</span>:
        <span role="status" className="text-warning-text">Applicant count unavailable; check before changing status.</span>}
      <Link href={base+"/applications"} className="font-semibold text-link underline">View applications</Link>
    </div>
    {!drive?<Alert tone="warning">
      Applicant impact could not be verified. Review the drive overview before any high-impact lifecycle action.
      <Link href={base+"/settings"} className="ml-2 font-semibold text-link underline">Retry</Link>
    </Alert>:null}
    <section aria-label="Linked company" className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-3)]">
      <h2 className="text-[16px] font-semibold text-[var(--lms-heading)]">Company</h2>
      <p className="mt-1 text-sm text-body">{drive?.companyName??"Company association unavailable"}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        Company names can be searched in the college-scoped directory. Verified relationships
        cannot be silently replaced on a published drive.
      </p>
      <Link href="/college/placements/companies"
        className="mt-2 inline-flex min-h-9 items-center font-semibold text-link underline">Search companies</Link>
      <p className="mt-1 text-xs text-muted-foreground">The company relationship is college-scoped.
        It cannot be replaced by free-text editing on this page; manage verified company relationships
        in the placement operations workspace before creating a replacement draft.</p>
      {!drive?<Alert tone="info">Company matching could not be verified. Check the Companies directory; do not save an unlinked name.</Alert>:null}
      {job.status==="DRAFT"&&companyChoices?
        <CollegeDraftCompanyPicker jobId={job.id}
          currentRelationshipId={job.companyRelationshipId}
          currentCompanyName={drive?.companyName??companyChoices.items.find(
            item=>item.relationshipId===job.companyRelationshipId)?.name??""}
          version={job.version}
          choices={companyChoices.items.map(item=>({
            relationshipId:item.relationshipId,name:item.name,
          }))}
          truncated={companyChoices.total>companyChoices.items.length}/>:
        job.status==="DRAFT"?
        <Alert tone="warning" role="alert">Company choices are unavailable. Company edits are disabled; use the Companies directory and retry.</Alert>:null}
    </section>
    {job.status==="DRAFT"&&eligibilityPolicy&&cohortGroups&&sectionGroups?
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
          sections:sectionGroups.flatMap(({program,cohort,sections})=>sections.map(section=>({
            id:section.id,name:section.name,code:section.code,
            cohortId:cohort.id,cohortName:cohort.name,programId:program.id,
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
          legacyPostingDetails:job.legacyPostingDetails,
        },policy:{
          allowedProgramIds:eligibilityPolicy.allowedProgramIds,
          allowedCohortIds:eligibilityPolicy.allowedCohortIds,
          allowedSectionIds:eligibilityPolicy.allowedSectionIds,
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
    <section aria-label="Drive status" className="min-w-0">
      <h2 className="mb-3 text-[16px] font-semibold text-[var(--lms-heading)]">Drive status</h2>
      <CollegeLegacyDriveSettings jobId={jobId} status={(drive?.status??job.status) as CollegeLegacyDriveStatus}/>
    </section>
    {(drive?.status??job.status)!=="ARCHIVED"?<Disclosure title="Danger zone · Delete drive" className="min-w-0 border-b border-[var(--lms-canvas-border)]"><div className="min-w-0 pt-[var(--lms-space-2)]"><CollegeDriveArchiveAction jobId={jobId}/></div></Disclosure>:null}
  </CollegeDriveSettingsDirtyGuard>;
}
