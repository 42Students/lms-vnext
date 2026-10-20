import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {PageHeader} from "@/components/ui/page-header";
import {Alert} from "@/components/ui/alert";
import {getCollegeDriveOverview} from "@/modules/placements/college-drive-overview-service";
import {CollegeLegacyDriveSettings} from "@/components/placements/college-legacy-drive-settings";
import {CollegeDriveArchiveAction} from "@/components/placements/college-drive-archive-action";
import {PlacementDraftEditForm} from "@/components/placements/placement-draft-edit-form";
import {listPrograms} from "@/modules/academics/program-service";
import {listCohorts} from "@/modules/academics/cohort-service";
import {getPlacementJob} from "@/modules/placements/job-service";
import {getJobEligibilityPolicy} from "@/modules/placements/eligibility-service";
import type {CollegeLegacyDriveStatus} from "@/modules/placements/college-legacy-drive-settings-model";

export default async function CollegeDriveSettingsPage({
  params,
}:{params:Promise<{jobId:string}>}) {
  const context=await getCurrentRequestContext();
  if(!context.membership||!hasMembershipRole(context,"COLLEGE_ADMIN")){
    redirect("/dashboard");
  }
  const {jobId}=await params;
  const [{drive},job]=await Promise.all([
    getCollegeDriveOverview(context,jobId),
    getPlacementJob(context,jobId),
  ]);
  const [eligibilityPolicy,programs]=job.status==="DRAFT"?await Promise.all([
    getJobEligibilityPolicy(context,jobId),
    listPrograms(context,job.collegeId),
  ]):[null,[]];
  const cohortGroups=job.status==="DRAFT"?await Promise.all(
    programs.map(async program=>({program,cohorts:await listCohorts(context,program.id)})),
  ):[];
  return <div className="space-y-6">
    <PageHeader title="Settings" description={drive.title}
      actions={<Link className="inline-flex min-h-11 md:min-h-9 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
        href={"/college/placements/jobs/"+encodeURIComponent(jobId)+"/overview"}>Overview</Link>}/>
    {job.status==="DRAFT"&&eligibilityPolicy?
      <section aria-label="Edit drive" className="min-w-0 space-y-3">
        <h2 className="text-lg font-semibold">Edit drive</h2>
        <PlacementDraftEditForm academicOptions={{
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
      <Alert tone="info">
        This drive is read-only. Only drafts in an active placement season are editable.
        Published-drive changes use the guarded lifecycle and deadline actions.
      </Alert>}
    <section aria-label="Legacy drive settings" className="min-w-0 space-y-4">
      <CollegeLegacyDriveSettings jobId={jobId} status={drive.status as CollegeLegacyDriveStatus}/>
    </section>
    {drive.status!=="ARCHIVED"?<CollegeDriveArchiveAction jobId={jobId}/>:null}
  </div>;
}
