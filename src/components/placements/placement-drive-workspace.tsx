import { Dropdown } from "@/components/ui/dropdown";
import { Disclosure } from "@/components/ui/disclosure";
import type { ReactNode } from "react";
import { ThirdPartyLink } from "@/components/ui/third-party-link";
import { PageHeader } from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import {AuthorizationError} from "@/modules/permissions/policy";
import { StatusBadge } from "@/components/ui/status-badge";
import { Alert } from "@/components/ui/alert";
import { listCohorts } from "@/modules/academics/cohort-service";
import {listSections} from "@/modules/academics/section-service";
import { listPrograms } from "@/modules/academics/program-service";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { listBulkDriveCandidates } from "@/modules/placements/bulk-drive-service";
import { PlacementBulkAddApplicants } from "./placement-bulk-add-applicants";
import { TpoRemindNonApplicants } from "./tpo-remind-non-applicants";
import { getTpoNonApplicantReminderPreview } from "@/modules/placements/tpo-remind-not-applied-service";
import { TpoDriveCloneAction } from "./tpo-drive-clone-action";
import {TpoDeleteDraftAction} from "./tpo-delete-draft-action";
import {TpoDriveRefreshControl} from "./tpo-drive-refresh-control";
import { getPlacementDriveDay } from "@/modules/placements/drive-day-service";
import { getJobEligibilityPolicy } from "@/modules/placements/eligibility-service";
import { getPlacementEvaluationConfig } from "@/modules/placements/evaluation-config-service";
import { getPlacementJobLegacyDetail } from "@/modules/placements/job-service";
import { listPlacementOfferCandidates } from "@/modules/placements/offer-service";
import { listPlacementScreeningQueue } from "@/modules/placements/screening-service";
import { getTpoScheduleConflicts } from "@/modules/placements/tpo-schedule-conflicts-service";
import { projectTpoDriveScheduleWarnings } from "@/modules/placements/tpo-drive-schedule-warnings-model";
import { getTpoDriveShortlist } from "@/modules/placements/tpo-shortlist-service";
import {countUnreleasedTpoSelections} from "@/modules/placements/tpo-drive-selection-service";
import { projectTpoDriveNextStep } from "@/modules/placements/tpo-drive-next-step-model";
import {projectTpoDriveHeader} from "@/modules/placements/tpo-drive-header-model";
import {tpoDriveLegacyInnerTabs} from "@/modules/placements/tpo-drive-tab-model";
import {DriveCompanyAvatar} from "./drive-company-avatar";
import {getTpoDriveJourney} from "@/modules/placements/tpo-drive-journey-service";
import { listPlacementJobRequests } from "@/modules/placements/request-service";
import { listPlacementRoleOptions } from "@/modules/placements/role-option-service";
import { PlacementDraftEditForm } from "./placement-draft-edit-form";
import {listPlacementJobTypeChoices} from "@/modules/placements/tpo-configuration-read-service";
import { PlacementDriveDayOverview } from "./placement-drive-day-overview";
import { PlacementJobLifecycleControls } from "./placement-job-lifecycle-controls";
import { TpoDriveLifecycleControls } from "./tpo-drive-lifecycle-controls";
import { getTpoDriveLifecycleReadiness } from "@/modules/placements/tpo-drive-lifecycle-service";
import {getTpoRoundReorderReadiness} from "@/modules/placements/round-service";
import {getTpoDriveDeadlineState} from "@/modules/placements/tpo-drive-deadline-service";
import {TpoDriveDeadlineForm} from "./tpo-drive-deadline-form";
import {TpoRoundReorder} from "./tpo-round-reorder";
import { PlacementOfferControls } from "./placement-offer-controls";
import { PlacementRoleOptions } from "./placement-role-options";
import { PlacementRequestQueue } from "./placement-request-queue";
import {
  PlacementDriveControls,
  type PlacementDriveControlData,
} from "./placement-drive-controls";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
import { istDateTimeFormatter } from "@/lib/format-date";
import { createDateFormatter } from "@/lib/format-date";

function formatDriveIst(date:Date|null){
 return date?createDateFormatter("en-IN", {day:"numeric",month:"short",hour:"numeric",
  minute:"2-digit",hour12:true,timeZone:"Asia/Kolkata"}).format(date)+" IST":"Date to be decided";
}
export async function PlacementDriveWorkspace({
  context,
  jobId,
  eyebrow,
  openPublish = false,
  overview,
  applicationsHref,
}: {
  context: RequestContext;
  jobId: string;
  eyebrow?: string;
  openPublish?: boolean;
  overview?: ReactNode;
  applicationsHref?: string;
}) {
  // The drive identity is required; panel counts, staff tooling and previews
  // are independent reads and must not turn an unavailable section into "0".
  const [job,optional]=await Promise.all([getPlacementJobLegacyDetail(context,jobId),Promise.allSettled([
    getPlacementDriveDay(context,jobId),
    getPlacementEvaluationConfig(context,jobId),
    listPlacementScreeningQueue(context,jobId),
    getJobEligibilityPolicy(context,jobId),
    listPlacementOfferCandidates(context,jobId),
    listPlacementRoleOptions(context,jobId),
    listPlacementJobRequests(context,jobId),
  ] as const)]);
  for(const result of optional){
   if(result.status==="rejected"&&result.reason instanceof AuthorizationError)
    throw result.reason;
  }
  const [dayRead,evaluationRead,screeningRead,policyRead,offersRead,rolesRead,requestsRead]=optional;
  const driveDay=dayRead.status==="fulfilled"?dayRead.value:null;
  const evaluation=evaluationRead.status==="fulfilled"?evaluationRead.value:null;
  const screening=screeningRead.status==="fulfilled"?screeningRead.value:null;
  const eligibilityPolicy=policyRead.status==="fulfilled"?policyRead.value:null;
  const offerCandidates=offersRead.status==="fulfilled"?offersRead.value:null;
  const roleOptions=rolesRead.status==="fulfilled"?rolesRead.value:null;
  const placementRequests=requestsRead.status==="fulfilled"?requestsRead.value:null;
  const isTpo=hasMembershipRole(context,"TPO");
  const isSuperAdminDrive=applicationsHref?.startsWith("/admin/placements/jobs/")??false;
  const driveHref=(isTpo?"/tpo/placements/jobs/":isSuperAdminDrive?
   "/admin/placements/jobs/":"/college/placements/jobs/")+encodeURIComponent(jobId);
  if(!driveDay)return <div className="min-w-0 space-y-4">
   <PageHeader title={job.title} description="The placement drive is available, but the current schedule could not be loaded."/>
   <ErrorState title="Couldn't refresh this drive"
    description="Showing the last drive data we loaded is unavailable in this request. Retry to load the current schedule; no empty state or zero count has been inferred."
    action={<TextLink href={driveHref} className="inline-flex min-h-11 items-center md:min-h-9">Retry</TextLink>}/>
  </div>;

  const jobTypes=job.status==="DRAFT"?await listPlacementJobTypeChoices(context,job.collegeId).catch(()=>null):[];
  // Read optional panels concurrently. Their failure must not misrepresent
  // a safe-to-publish state or hide the primary drive page.
  const [lifecycleReadiness,collisionAssessment,shortlist,roundOrder,deadlineState,bulkCandidates]=
   await Promise.all([
    isTpo?getTpoDriveLifecycleReadiness(context,jobId).catch(()=>null):Promise.resolve(null),
    isTpo?getTpoScheduleConflicts(context,{days:90}).catch(()=>null):Promise.resolve(null),
    isTpo?getTpoDriveShortlist(context,{jobId}).catch(()=>null):Promise.resolve(null),
    isTpo?getTpoRoundReorderReadiness(context,jobId).catch(()=>null):Promise.resolve(null),
    isTpo&&job.status==="PUBLISHED"?
     getTpoDriveDeadlineState(context,jobId).catch(()=>null):Promise.resolve(null),
    isTpo&&job.status==="PUBLISHED"?
     listBulkDriveCandidates(context,jobId).catch(()=>null):Promise.resolve(null),
   ]);

  const scheduleWarnings=isTpo?projectTpoDriveScheduleWarnings(
   collisionAssessment,driveDay.rounds.map(round=>round.id)):undefined;

  const programs=job.status==="DRAFT"?
    await listPrograms(context,job.collegeId).catch(()=>null):[];

  const cohortGroups=programs&&job.status==="DRAFT"?
    await Promise.all(programs.map(async program=>({
     program,cohorts:await listCohorts(context,program.id),
    }))).catch(()=>null):[];

  const sectionGroups=job.status==="DRAFT"&&cohortGroups?await Promise.all(
    cohortGroups.flatMap(({program,cohorts})=>cohorts
      .filter(cohort=>cohort.status!=="ARCHIVED")
      .map(async cohort=>({program,cohort,
       sections:await listSections(context,cohort.id)})))).catch(()=>null):[];
  const draftReady=job.status==="DRAFT"&&jobTypes!==null&&eligibilityPolicy!==null&&
    programs!==null&&cohortGroups!==null&&sectionGroups!==null;
  const failedSections=[
   ...(!evaluation?["Evaluation"]:[]),...(!screening?["Screening"]:[]),
   ...(!eligibilityPolicy?["Eligibility"]:[]),...(!offerCandidates?["Offers"]:[]),
   ...(!roleOptions?["Role options"]:[]),...(!placementRequests?["Requests"]:[]),
   ...(job.status==="DRAFT"&&!draftReady?["Draft editor options"]:[]),
  ];

  const controlData: PlacementDriveControlData|null = evaluation&&screening?{
    jobId,
    jobStatus: driveDay.job.status,
    evaluation: {
      state: evaluation.state,
      editable: evaluation.editable,
      rounds: evaluation.rounds.map((round) => ({
        id: round.id,
        sequence: round.sequence,
        kind:
          round.kind as PlacementDriveControlData["evaluation"]["rounds"][number]["kind"],
        name: round.name,
        whatToBring: round.whatToBring,
        platform: round.platform,
        testUrl: round.testUrl,
        durationMinutes: round.durationMinutes,
        status: round.status,
      })),
    },
    screening: screening.map((item) => ({
      applicationId: item.application.id,
      membershipId:
        item.candidate.membershipId,
      status:
        item.screening.status as PlacementDriveControlData["screening"][number]["status"],
      roleTitle:
        item.roleOption.title,
      candidateMessage:
        item.screening.candidateMessage,
      internalReason:
        item.screening.internalReason,
      candidate: {
        displayName: item.candidate.displayName,
        email: item.candidate.email,
        phoneE164: item.candidate.phoneE164,
      },
    })),
    rounds: driveDay.rounds.map((round) => ({
      id: round.id,
      sequence: round.sequence,
      kind:
        round.kind as PlacementDriveControlData["rounds"][number]["kind"],
      name: round.name,
      status: round.status,
      scheduledAt:
        round.scheduledAt?.toISOString() ?? null,
      timezone: round.timezone,
      mode:
        round.mode as PlacementDriveControlData["rounds"][number]["mode"],
      venue: round.venue,
      meetingUrl: round.meetingUrl,
      resultsDueAt:
        round.resultsDueAt?.toISOString() ?? null,
      platform: round.platform,
      testUrl: round.testUrl,
      durationMinutes: round.durationMinutes,
      whatToBring: round.whatToBring,
      participants: round.participants.map(
        (participant) => ({
          applicationId:
            participant.applicationId,
          roleTitle: participant.roleTitle,
          displayName: participant.displayName,
          email: participant.email,
          result: participant.result
            ? {
                id: participant.result.id,
                status:
                  participant.result.status,
                outcome:
                  participant.result.outcome as PlacementDriveControlData["rounds"][number]["participants"][number]["result"] extends infer Result
                    ? Result extends { outcome: infer Outcome }
                      ? Outcome
                      : never
                    : never,
                waitlistRank:
                  participant.result.waitlistRank,
                scorePercent:
                  participant.result.scorePercent,
                reasonCategory:
                  participant.result.reasonCategory as PlacementDriveControlData["rounds"][number]["participants"][number]["result"] extends infer Result
                    ? Result extends { reasonCategory: infer Category }
                      ? Category
                      : never
                    : never,
                candidateMessage:
                  participant.result.candidateMessage,
                internalComment:
                  participant.result.internalComment,
              }
            : null,
        }),
      ),
    })),
  }:null;

  const headerFacts = projectTpoDriveHeader({
    status:job.status,applicationMode:job.applicationMode,workMode:job.workMode,
    employmentType:job.employmentType,
    minimumAnnualCtcInr:job.minimumAnnualCtcInr,
    maximumAnnualCtcInr:job.maximumAnnualCtcInr,
    applicationDeadline:job.applicationDeadline,
    isDream:job.isDream,legacyJobCategory:job.legacyJobCategory,stipendPerMonthInr:job.stipendPerMonthInr,
    recordedOutside:job.recordedOutside,
  });

  // These three projections have no dependencies on each other; loading
  // them together avoids extending first paint through sequential reads.
  const [journey,pendingSelections,reminderPreview]=await Promise.all([
    isTpo?getTpoDriveJourney(context,jobId).catch(()=>null):Promise.resolve(null),
    isTpo&&job.status==="PUBLISHED"
      ?countUnreleasedTpoSelections(context,jobId).catch(()=>null):Promise.resolve(0),
    isTpo&&job.status==="PUBLISHED"
      ?getTpoNonApplicantReminderPreview(context,jobId).catch(()=>null):Promise.resolve(null),
  ]);

  const appliedCount=journey?.stages.find(stage=>stage.name==="Applied")?.count??null;
  const notAppliedCount=reminderPreview?.count??null;
  // Legacy denominator: applicants + registered non-applicants; do not
  // divide by the entire eligible audience or sum historical journey stages.
  const applicationRate=appliedCount!==null&&notAppliedCount!==null
    ? Math.round(100*appliedCount/Math.max(1,appliedCount+notAppliedCount)):null;

  const nextStep = isTpo&&lifecycleReadiness&&journey&&shortlist&&placementRequests&&
    pendingSelections!==null&&evaluation&&screening&&offerCandidates&&roleOptions
    ? projectTpoDriveNextStep({
        jobId,
        status: job.status,
        publishAllowed: lifecycleReadiness.publish.allowed,
        closeAllowed: lifecycleReadiness.close.allowed,
        shortlistCount: shortlist.total,
        applicantCount: journey.stages.find(stage => stage.name === "Applied")?.count ?? 0,
        recordedOutside: job.recordedOutside,
        deadlinePassed: Boolean(job.applicationDeadline && job.applicationDeadline.getTime() <= Date.now()),
        pendingSelections,
        pendingRequests: placementRequests.filter(row => row.request.status === "PENDING").length,
        nonApplicantCount: reminderPreview?.count ?? 0,
        canRemindNonApplicants: Boolean(reminderPreview?.allowed && !reminderPreview.alreadySent),
        deadlineMissing: job.applicationDeadline===null,
        stagedRounds: driveDay.rounds.map(round => ({
          id: round.id,
          name: round.name,
          pendingCount: round.participants.filter(p => p.result?.status === "STAGED").length,
        })),
      })
    : null;

  return (
    <div className="min-w-0 space-y-[var(--lms-space-4)]">
      <PageHeader
        {...(eyebrow !== undefined ? {eyebrow} : {})}
        title={job.title}
        description={job.companyName+" · "+headerFacts.status+(job.applicationDeadline?" · Deadline "+formatDriveIst(job.applicationDeadline):"")}
        actions={
          <div className="flex min-w-0 w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          {isSuperAdminDrive?<ButtonLink variant="secondary" href={"/admin/placements/jobs/"+encodeURIComponent(jobId)+"/settings"+(applicationsHref?.includes("?returnTo=")?"?"+applicationsHref.split("?")[1]:"")}
             className="w-full sm:w-auto">
             <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/><path d="m16.5 3.5 4 4L9 19l-5 1 1-5L16.5 3.5Z"/>
             </svg>Edit drive</ButtonLink>:null}
          {!isTpo ? <ButtonLink variant="primary" href={applicationsHref ?? "/college/placements/jobs/" + encodeURIComponent(jobId) + "/applications"}
            className="w-full sm:w-auto">
            {isSuperAdminDrive?<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
             <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
             <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>:null}{isSuperAdminDrive?"View applications":"Applications"}</ButtonLink> : null}
          {isTpo&&nextStep?<ButtonLink variant="primary" href={nextStep.primary.href}
             className="w-full sm:w-auto">{nextStep.primary.label}</ButtonLink>:null}
          {isTpo?<ButtonLink variant="secondary" href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/discussion"}
             className="w-full sm:w-auto">Discussion</ButtonLink>:null}
          <Dropdown mobileSheet align="end" label="Drive actions" trigger={isTpo?"More":"Actions"} className="w-full sm:w-auto">
            <p id="drive-actions-scroll-hint" className="hidden text-xs text-muted-foreground group-open:block md:!hidden leading-[20px]">Scroll for more drive actions ↓</p>
            <div role="group" aria-label="Drive action choices" aria-describedby="drive-actions-scroll-hint" tabIndex={0}
              className="flex max-h-[65dvh] min-w-0 flex-col gap-2 overflow-y-auto overscroll-contain pb-4 [mask-image:linear-gradient(to_bottom,#000_0%,#000_calc(100%-1rem),transparent_100%)] md:max-h-72 md:flex-col md:overflow-y-auto md:pb-0">
            {nextStep&&!isTpo ? (
              <ButtonLink variant="primary" href={nextStep.primary.href}>
                {nextStep.primary.label}
              </ButtonLink>
            ) : null}
            {hasMembershipRole(context, "TPO") ? (
              <ButtonLink variant="secondary" href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/applicants-pipeline"}>
                Applicants
              </ButtonLink>
            ) : null}
            {isTpo && job.status === "DRAFT" ? (
              <ButtonLink variant="secondary" href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/edit"}>
                Edit draft
              </ButtonLink>
            ) : null}
            {isTpo ? <div role="group" aria-label="More drive actions">
              <div className="grid min-w-[min(14rem,calc(100vw_-_5rem))] max-w-full gap-2">
                <ButtonLink variant="secondary" href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/applications-export"}>
                  Export applicants
                </ButtonLink>
                <ButtonLink variant="secondary"
                  href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/share-preview"}>
                  Share with company
                </ButtonLink>
                {["CLOSED","CANCELLED","REJECTED"].includes(job.status)
                  ? <TpoDriveCloneAction jobId={jobId} label="Run it again" /> : null}
              </div>
            </div>:null}
            {isTpo && job.status === "PUBLISHED" ? (
              <ButtonLink variant="secondary" href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/close-preview"}>
                Close drive
              </ButtonLink>
            ) : null}
            {isTpo && (job.status === "DRAFT" || job.status === "PUBLISHED") ? (
              <ButtonLink variant="secondary" href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/cancel-preview"}>
                Cancel drive
              </ButtonLink>
            ) : null}
            {isTpo && job.status === "PUBLISHED" && job.applicationDeadline ? (
              <ButtonLink variant="secondary" href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/extend-deadline"}>
                Extend deadline
              </ButtonLink>
            ) : null}
            {hasMembershipRole(context, "TPO") ? (
              <ButtonLink variant="secondary"
                href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/shortlist"}
              >
                Current shortlist &amp; CSV
              </ButtonLink>
            ) : null}
            {hasMembershipRole(context, "TPO") ? (
              <ButtonLink variant="secondary"
                href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/letters"}
              >
                Offer letter evidence
              </ButtonLink>
            ) : null}
            {hasMembershipRole(context, "TPO") ? (
              <ButtonLink variant="secondary"
                href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/closeout"}
              >
                Drive close-out report
              </ButtonLink>
            ) : null}
            {hasMembershipRole(context, "TPO") ? (
              <ButtonLink variant="secondary"
                href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/candidate-schedule"}
              >
                Candidate round schedule
              </ButtonLink>
            ) : null}
            {hasMembershipRole(context, "TPO") ? (
              <ButtonLink variant="secondary"
                href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/joining"}
              >
                Manage joining outcomes
              </ButtonLink>
            ) : null}
            <ButtonLink variant="primary"
              href={isTpo
                ? "/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/applications-export"
                : "/api/placements/jobs/" + encodeURIComponent(jobId) + "/applicants/export"}
            >
              {isTpo ? "Review and export applicants" : "Export applicants (CSV)"}
            </ButtonLink>
            </div>
          </Dropdown>
          </div>
        }
      />
      {failedSections.length?<Alert tone="warning">
       Couldn't refresh this drive. Unable to load: {failedSections.join(", ")}.
       Other verified sections remain available; unavailable counts are not zero.
       <TextLink href={driveHref} className="ml-2 inline-flex min-h-11 items-center md:min-h-9">Retry</TextLink>
      </Alert>:null}
      {nextStep ? (
        <section aria-label="Next step" className="rounded-[var(--lms-canvas-radius)] border border-primary bg-primary-subtle p-4" data-testid="drive.next-step">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next step</p>
          <Heading level={2} size="lg" className="mt-1 leading-7 text-[var(--lms-heading)]">{nextStep.primary.label}</Heading>
          <p className="mt-1 text-sm text-body leading-[22px]">{nextStep.primary.description}</p>
          {applicationRate!==null?<p className="mt-2 text-xs text-muted-foreground">
            Application rate {applicationRate}% · {appliedCount} applied · {notAppliedCount} registered not applied
          </p>:null}
          <ButtonLink variant="primary" href={nextStep.primary.href}
            className="mt-3 w-full sm:w-auto">
            {nextStep.primary.label}
          </ButtonLink>
          {nextStep.more.length > 0 ? (
            <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="font-semibold text-body">Also waiting:</span>
              {nextStep.more.slice(0,3).map(step => (
                <TextLink key={step.href} href={step.href} title={step.description}
                  className="inline-flex min-h-11 items-center md:min-h-9">
                  {step.label} →
                </TextLink>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
      {isTpo?<nav aria-label="Drive sections" className="flex min-w-0 flex-wrap gap-2 border-b border-border pb-3 text-sm">
        {tpoDriveLegacyInnerTabs(jobId,{
          ...(screening !== undefined && screening !== null ? {applicants:screening.length} : {}),rounds:driveDay.rounds.length,
          ...(offerCandidates !== undefined && offerCandidates !== null ? {offers:offerCandidates.filter(item=>item.offer?.status==="ISSUED"||
            item.offer?.status==="ACCEPTED").length} : {}),
        }).filter(tab=>tab.label!=="Drive day"||driveDay.rounds.some(round=>
          round.mode===null||round.mode==="ON_CAMPUS"
        )).map(tab=><TextLink key={tab.href} href={tab.href}
          className="inline-flex min-h-11 items-center border-b-2 border-transparent px-3 md:min-h-9">{tab.label}</TextLink>)}
      </nav>:null}
      {isTpo?<TpoDriveRefreshControl/>:null}
      {isTpo&&job.status==="DRAFT"?
       <TpoDeleteDraftAction jobId={jobId} updatedAt={job.updatedAt.toISOString()}/>:null}
      {isTpo&&!lifecycleReadiness?
       <Alert tone="warning">
        Could not load: Publication readiness. Publishing is unavailable until these checks recover.
        Refresh the drive to try again.
       </Alert>:null}
      <section aria-label="Drive status and details"
         className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-l-2 border-border p-4"
         style={{borderLeftColor:headerFacts.heroAccent}}>
         <div className="flex flex-wrap items-start gap-3">
           <DriveCompanyAvatar name={job.companyName} logoUrl={job.companyLogoUrl}/>
           <div className="min-w-0 flex-1">
             <Heading level={2} size="lg" className="break-words leading-6 text-[var(--lms-heading)]">{job.title}</Heading>
             <p className="text-sm text-muted-foreground">{job.companyName}</p>
             <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
               <span className="font-semibold text-muted-foreground">Status</span>
               <StatusBadge tone={headerFacts.statusTone}>{headerFacts.status}</StatusBadge>
               <span className="font-semibold text-muted-foreground">Job type</span>
               <span>{job.jobTypeLabel??headerFacts.legacyFacts[1]?.value}</span>
               <span className="font-semibold text-muted-foreground">Mode</span>
               <span>{job.recruiterDriveMode==="POOL"?"Pool":job.recruiterDriveMode==="OFF_CAMPUS"?"Off campus":"On campus"}</span>
               <span>{headerFacts.applicationMode}</span>
               <span>· {headerFacts.workMode}</span>
               <StatusBadge tone="info">{headerFacts.category}</StatusBadge>
               {job.recordedOutside?<strong>Recorded: happened outside</strong>:null}
             </div>
             <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-body">
               <span>CTC: {headerFacts.ctc}</span>
               <span>Deadline: {job.applicationDeadline?formatDriveIst(job.applicationDeadline):headerFacts.deadline}</span>
             </div>
           </div>
         </div>
         {job.description?<div className="mt-4 border-t border-border pt-3">
           <Disclosure title={<>
               <span className="group-open:hidden">Show more</span><span className="hidden group-open:inline">Show less</span>
             </>} preserveSummary summaryClassName="inline-flex min-h-11 items-center md:min-h-9">
             <p className="line-clamp-3 whitespace-pre-wrap break-words leading-[22px] group-open:line-clamp-none">{job.description}</p>
           </Disclosure>
         </div>:null}
       </section>
      {overview}
      {job.legacyPostingDetails&&(job.legacyPostingDetails.portal?.studentsRegisterSeparately||
        job.legacyPostingDetails.campusPool?.hostCollege||
        job.legacyPostingDetails.campusPool?.reportingTime||
        job.legacyPostingDetails.campusPool?.travelNote||
        job.legacyPostingDetails.skillsWanted?.length)?(
        <section aria-label="Supplementary employer details" className="min-w-0 border-b border-border pb-4">
          <Heading level={2} size="base" className="leading-[26px] md:text-[18px] md:leading-[28px] lg:text-[20px] lg:leading-[30px] text-[var(--lms-heading)]">Employer information</Heading>
          {job.legacyPostingDetails.portal?.studentsRegisterSeparately?(
            <p className="mt-2 text-sm text-body leading-[22px]">
              Students also register on {job.legacyPostingDetails.portal.name}.
              {/^https:\/\/[^/]+/i.test(job.legacyPostingDetails.portal.url)?(
                <>{" "}<ThirdPartyLink href={job.legacyPostingDetails.portal.url} label="Open employer portal"/></>
              ):null}
            </p>
          ):null}
          {job.legacyPostingDetails.campusPool?.hostCollege?(
            <p className="mt-2 text-sm text-body leading-[22px]">Pool host: {job.legacyPostingDetails.campusPool.hostCollege}</p>
          ):null}
          {job.legacyPostingDetails.campusPool?.reportingTime?(
            <p className="mt-2 text-sm text-body leading-[22px]">Pool reporting time (IST): {istDateTimeFormatter.format(
                new Date(job.legacyPostingDetails.campusPool.reportingTime))}</p>
          ):null}
          {job.legacyPostingDetails.campusPool?.travelNote?(
            <p className="mt-2 whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm text-body leading-[22px]">Travel: {job.legacyPostingDetails.campusPool.travelNote}</p>
          ):null}
          {job.legacyPostingDetails.skillsWanted?.length?(
            <p className="mt-2 break-words [overflow-wrap:anywhere] text-sm text-body leading-[22px]">Requested skills: {job.legacyPostingDetails.skillsWanted.join(", ")}</p>
          ):null}
          <p className="mt-2 text-xs text-muted-foreground leading-[20px]">Supplementary details do not automatically create a venue, travel booking or eligibility rule.</p>
        </section>
      ):null}
      {deadlineState?.extendable?(
        <section id="drive-deadline-actions" aria-label="Set or extend deadline"
          className="min-w-0 border-b border-border pb-4">
          <Disclosure title={deadlineState.applicationDeadline?"Extend deadline":"Set deadline"} className="[&>summary]:font-semibold [&>summary]:text-[var(--lms-link-text)]">
            <div className="mt-4"><TpoDriveDeadlineForm job={deadlineState}/></div>
          </Disclosure>
        </section>
      ):null}
      {journey&&!isTpo?<section aria-label="Drive applicant journey" className="min-w-0 border-b border-border pb-4">
        <Heading level={2} size="base" className="leading-[26px] md:text-[18px] md:leading-[28px] lg:text-[20px] lg:leading-[30px] text-[var(--lms-heading)]">Journey</Heading>
        <p className="mt-1 text-xs text-body leading-[20px]">{journey.definition}</p>
        <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border md:grid-cols-3 xl:grid-cols-6">
          {journey.stages.map(stage=><TextLink variant="bare" key={stage.name} href={stage.href}
            className="min-w-0 border-b border-r border-border p-3 text-foreground hover:bg-primary-subtle focus-ring-inset even:border-r-0 md:even:border-r md:[&:nth-child(3n)]:border-r-0 xl:[&:nth-child(3n)]:border-r xl:border-b-0 xl:last:border-r-0">
            <span className="block text-xs text-body">{stage.name}</span>
            <strong className="mt-2 block text-2xl tabular-nums">{stage.count}</strong>
          </TextLink>)}
        </div>
        <p className="mt-3 text-xs text-body leading-[20px]">{journey.excluded} registered learners excluded or not notified from {journey.considered} considered.
          {applicationRate!==null?" · Application rate: "+applicationRate+"%.":""}</p>
      </section>:null}
      {isTpo && driveDay.rounds.length > 0 ? (
        <section aria-label="Round journey" className="min-w-0 border-b border-border pb-4">
          <Heading level={2} size="base" className="leading-[26px] md:text-[18px] md:leading-[28px] lg:text-[20px] lg:leading-[30px] text-[var(--lms-heading)]">Rounds ({driveDay.rounds.length})</Heading>
          <p className="mt-1 text-sm text-body leading-[22px]">Round status, schedule and outcome progress. Open a round to see who has reached it.</p>
          <div className="mt-3 divide-y divide-border">
            {driveDay.rounds.map(round => {
              const staged = round.participants.filter(p => p.result?.status === "STAGED").length;
              const applied = round.participants.filter(p => p.result?.status === "APPLIED").length;
              const rescheduleRequests=placementRequests?.filter(row=>
                row.request.status==="PENDING"&&row.request.requestType==="ROUND_RESCHEDULE"&&
                row.request.roundId===round.id).length??null;
              return (
                <article key={round.id} className="min-w-0 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Heading level={3} size="base" className="min-w-0 break-words leading-6 text-foreground">{round.sequence}. {round.name}</Heading>
                    <StatusBadge tone={round.status==="COMPLETED"?"success":round.status==="CANCELLED"?"error":round.status==="SCHEDULED"?"info":"warning"}>{round.status}</StatusBadge>
                  </div>
                  <dl className="mt-3 grid min-w-0 gap-3 text-sm text-body sm:grid-cols-2">
                    <div><dt className="font-semibold">When</dt><dd>{round.scheduledAt
                      ? formatDriveIst(round.scheduledAt)
                      : "Date to be decided"}</dd></div>
                    <div><dt className="font-semibold">Mode and place</dt>
                      <dd>{round.mode==="VIRTUAL"?"Online":round.mode==="ON_CAMPUS"?"On campus":(round.mode??"").replaceAll("_"," ")}
                        {" · "}{round.venue??(round.meetingUrl?"Online":"Venue to be told")}
                        {round.meetingUrl&&/^https:\/\//i.test(round.meetingUrl)?<ThirdPartyLink href={round.meetingUrl} label="Meeting link"/>:null}
                      </dd>
                    </div>
                    <div><dt className="font-semibold">Students in round</dt><dd>{round.participants.length}</dd></div>
                    <div><dt className="font-semibold">Results</dt><dd>{round.status==="COMPLETED"?"Results applied · ":""}{applied} applied · {staged} awaiting apply · {Math.max(0,round.participants.length-applied-staged)} not recorded</dd></div>
                    <div><dt className="font-semibold">Reschedule requests</dt><dd>{rescheduleRequests===null?"Unable to load":rescheduleRequests}
                      {rescheduleRequests!==null&&rescheduleRequests>0?<TextLink href="#drive-request-actions"
                        className="ml-2 max-md:inline-flex max-md:min-h-11 max-md:items-center">Review pending →</TextLink>:null}
                    </dd></div>
                    <div><dt className="font-semibold">Results expected</dt><dd>{round.resultsDueAt
                      ? istDateTimeFormatter.format(round.resultsDueAt)+" IST"
                      : "Not set"}</dd></div>
                    <div><dt className="font-semibold">Duration</dt><dd>{round.durationMinutes ? round.durationMinutes+" minutes" : "Not specified"}</dd></div>
                  </dl>
                  {round.platform ? <p className="mt-2 text-sm text-body leading-[22px]">Platform: {round.platform}</p> : null}
                  {round.testUrl&&/^https:\/\//i.test(round.testUrl)?<ThirdPartyLink href={round.testUrl} label="Open test instructions →"/>:null}
                  {round.whatToBring ? <p className="mt-1 text-sm text-body leading-[22px]">Bring: {round.whatToBring}</p> : null}
                  <div className="mt-3 flex min-w-0 flex-col gap-2 text-sm sm:flex-row sm:flex-wrap">
                    <ButtonLink variant="secondary" href={(round.mode===null||round.mode==="ON_CAMPUS")
                      ?"/tpo/drive-day/"+encodeURIComponent(round.id)
                      :"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/candidate-schedule?roundId="+encodeURIComponent(round.id)}
                      className="w-full sm:w-auto">{round.mode===null||round.mode==="ON_CAMPUS"
                        ?round.status==="COMPLETED"?"See attendance →":"Open drive day →"
                        :"See who reached this round →"}</ButtonLink>
                    {round.kind !== "TALK" ? <ButtonLink variant="secondary" href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/rounds/"+encodeURIComponent(round.id)+"/results"}
                      className="w-full sm:w-auto">Enter results →</ButtonLink> : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
      {isTpo && driveDay.rounds.length>0 ? (
        <Disclosure title={<>Enter round results <span aria-hidden="true" className="text-muted-foreground group-open:rotate-180">⌄</span></>} className="min-w-0" preserveSummary summaryClassName="flex min-h-11 items-center justify-between gap-2">
          <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
            {driveDay.rounds.filter(round=>round.kind!=="TALK").map(round=>
              <ButtonLink variant="secondary" key={round.id}
                href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/rounds/"+encodeURIComponent(round.id)+"/results"}
                className="w-full sm:w-auto">
                {round.name}
              </ButtonLink>)}
          </div>
        </Disclosure>
      ) : null}
      {isTpo ? (
        <section
          aria-label="Current screening shortlist"
          className="min-w-0 border-b border-border pb-4"
        >
          <Heading level={2} size="base" className="leading-[26px] md:text-[18px] md:leading-[28px] lg:text-[20px] lg:leading-[30px] text-[var(--lms-heading)]">
            Persisted screening shortlist
          </Heading>
          <p className="mt-2 text-sm text-body leading-[22px]">
            {shortlist
              ? String(shortlist.total) + " currently shortlisted submitted application(s). " +
                "This is an application count, not a unique learner count."
              : "Current shortlist could not be loaded. No count is inferred."}
          </p>
          <div className="mt-3 flex min-w-0 flex-col gap-2 text-sm sm:flex-row sm:flex-wrap">
            <TextLink
              href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/shortlist"}
              className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto md:min-h-9"
            >
              View persisted shortlist →
            </TextLink>
            <TextLink
              href={"/api/placements/jobs/" + encodeURIComponent(jobId) + "/shortlist/export"}
              className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto md:min-h-9"
            >
              Download formula-safe shortlist CSV
            </TextLink>
          </div>
        </section>
      ) : null}
      {job.status === "DRAFT"&&draftReady&&programs&&cohortGroups&&sectionGroups&&eligibilityPolicy&&jobTypes ? (
        <div id="draft-drive-editor"><PlacementDraftEditForm
          jobTypes={jobTypes}
          academicOptions={{
            programs: programs.map(
              (program) => ({
                id: program.id,
                name: program.name,
                code: program.code,
                departmentName:
                  program.departmentName,
              }),
            ),
            cohorts: cohortGroups.flatMap(
              ({ program, cohorts }) =>
                cohorts
                  .filter(
                    (cohort) =>
                      cohort.status !==
                      "ARCHIVED",
                  )
                  .map((cohort) => ({
                    id: cohort.id,
                    name: cohort.name,
                    code: cohort.code,
                    programId: program.id,
                    programName:
                      program.name,
                    status: cohort.status,
                  })),
            ),
            sections:sectionGroups.flatMap(({program,cohort,sections})=>
              sections.map(section=>({id:section.id,name:section.name,code:section.code,
                cohortId:cohort.id,cohortName:cohort.name,programId:program.id}))),
          }}
          value={{
            job: {
              id: job.id,
              title: job.title,
              description: job.description,
              employmentType:
                job.employmentType as
                  | "FULL_TIME"
                  | "INTERNSHIP"
                  | "CONTRACT",
              jobTypeLabel:job.jobTypeLabel,
              workMode:
                job.workMode as
                  | "ONSITE"
                  | "HYBRID"
                  | "REMOTE",
              locations: job.locations,
              openings: job.openings,
              minimumAnnualCtcInr:
                job.minimumAnnualCtcInr,
              maximumAnnualCtcInr:
                job.maximumAnnualCtcInr,
              applicationMode:
                job.applicationMode as
                  | "INTERNAL"
                  | "HYBRID"
                  | "EXTERNAL_ONLY",
              externalApplicationUrl:
                job.externalApplicationUrl,
              applicationDeadline:
                job.applicationDeadline?.toISOString() ??
                null,
              legacyPostingDetails:job.legacyPostingDetails,
            },
            policy: {
              allowedProgramIds:
                eligibilityPolicy.allowedProgramIds,
              allowedCohortIds:
                eligibilityPolicy.allowedCohortIds,
              allowedSectionIds:eligibilityPolicy.allowedSectionIds,
              minCgpa:
                eligibilityPolicy.minCgpa,
              maxActiveBacklogs:
                eligibilityPolicy.maxActiveBacklogs,
              maxPastBacklogs:
                eligibilityPolicy.maxPastBacklogs,
              minTenthPercentage:
                eligibilityPolicy.minTenthPercentage,
              minTwelfthPercentage:
                eligibilityPolicy.minTwelfthPercentage,
              minDiplomaPercentage:
                eligibilityPolicy.minDiplomaPercentage,
              minUndergraduatePercentage:
                eligibilityPolicy.minUndergraduatePercentage,
              maxGapYears:
                eligibilityPolicy.maxGapYears,
              allowedPassingYears:
                eligibilityPolicy.allowedPassingYears,
              missingEvidencePolicy:
                eligibilityPolicy.missingEvidencePolicy as
                  | "ALLOW_WITH_FLAG"
                  | "REQUIRE_COMPLETE",
            },
          }}
        /></div>
      ) : job.status==="DRAFT"?<Alert tone="warning">
       Draft fields or academic eligibility options couldn't be refreshed. Editing and publishing are unavailable until they reload.
       <TextLink href={driveHref} className="ml-2">Retry</TextLink>
      </Alert>:null}
      {roleOptions?<PlacementRoleOptions
        jobId={jobId}
        jobStatus={job.status}
        roles={roleOptions.map((role) => ({
          id: role.id,
          title: role.title,
          employmentType:
            role.employmentType,
          workMode: role.workMode,
          locations: role.locations,
          openings: role.openings,
          minimumAnnualCtcInr:
            role.minimumAnnualCtcInr,
          maximumAnnualCtcInr:
            role.maximumAnnualCtcInr,
          isPrimary: role.isPrimary,
          status: role.status,
        }))}
      />:<Alert tone="warning">Role options could not be loaded. Retry before editing or using bulk actions.</Alert>}
      {isTpo&&job.status==="PUBLISHED"&&!bulkCandidates?
       <Alert tone="warning">
        Could not load: Bulk applicants. Other drive sections are still available.
        Refresh the drive to retry this section.
       </Alert>:null}
      {bulkCandidates&&roleOptions ? (
        <PlacementBulkAddApplicants
          jobId={jobId}
          initial={bulkCandidates}
          roles={roleOptions.filter((role) => role.status === "ACTIVE").map((role) => ({
            id: role.id,
            title: role.title,
          }))}
        />
      ) : null}
      {job.status==="PUBLISHED"?<section id="drive-registered-not-applied" aria-label="Registered students who have not applied"
        className="min-w-0 border-b border-border pb-4">
        <Heading level={2} size="base" className="mb-2 leading-[26px] md:text-[18px] md:leading-[28px] lg:text-[20px] lg:leading-[30px] text-[var(--lms-heading)]">Registered, not applied</Heading>
        <p className="mb-3 text-sm text-body leading-[22px]">{reminderPreview && reminderPreview.allowed
          ? reminderPreview.count+" eligible registered students have not applied. Remind once per day, before the deadline."
          : "Remind eligible registered students who have not applied. Once per day, and only before the deadline."}</p>
        <TpoRemindNonApplicants jobId={jobId}/>
      </section>:null}
      {placementRequests?<section id="drive-request-actions" className="min-w-0">
      <PlacementRequestQueue
        requests={placementRequests.map(
          (row) => ({
            id: row.request.id,
            requestType:
              row.request.requestType as
                | "APPLICATION_WITHDRAWAL"
                | "ROUND_RESCHEDULE"
                | "OFFER_EXTENSION",
            status:
              row.request.status as
                | "PENDING"
                | "APPROVED"
                | "REJECTED"
                | "CANCELLED",
            reason: row.request.reason,
            decisionNote:
              row.request.decisionNote,
            requestedAt:
              row.request.requestedAt.toISOString(),
            candidateName:
              row.candidate.displayName,
            candidateEmail:
              row.candidate.email,
            roleTitle:
              row.roleOption.title,
            roundName:
              row.round?.name ?? null,
            roundScheduledAt:
              row.round?.scheduledAt?.toISOString() ??
              null,
            offerRoleTitle:
              row.offer?.roleTitle ?? null,
            offerExpiresAt:
              row.offer?.expiresAt?.toISOString() ??
              null,
            effectPayload:
              (row.request.effectPayload ??
                {}) as Record<
                string,
                unknown
              >,
          }),
        )}
      />
      </section>:<Alert tone="warning">Requests could not be refreshed; pending count and decisions are unavailable.</Alert>}
      {isTpo&&lifecycleReadiness ? (
        <TpoDriveLifecycleControls readiness={lifecycleReadiness} initialPublish={openPublish} />
      ) : isTpo?<Alert tone="warning">
       Publication/closure checks could not be refreshed. Publishing and closing are blocked until readiness is confirmed.
      </Alert>:(
        <PlacementJobLifecycleControls
          jobId={jobId}
          status={driveDay.job.status as
            | "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED"}
        />
      )}
      <Disclosure title={<>
          Drive day operations <span aria-hidden="true" className="text-muted-foreground group-open:rotate-180">⌄</span>
        </>} className="min-w-0" preserveSummary summaryClassName="flex min-h-11 items-center justify-between gap-2">
        <p className="py-2 text-sm text-muted-foreground">Open a round to take attendance and record results on your phone on the day.</p>
         <div className="pt-3"><PlacementDriveDayOverview driveDay={driveDay} embedded /></div>
      </Disclosure>
      {roundOrder?<TpoRoundReorder jobId={jobId} readiness={roundOrder}/>:null}
      <section id="drive-round-actions" className="min-w-0">
      {controlData?<PlacementDriveControls
        data={controlData}
        {...(scheduleWarnings !== undefined ? {scheduleWarnings} : {})}
      />:<Alert tone="warning">Evaluation or screening data could not be loaded. Editing rounds and candidate screening is unavailable.</Alert>}
      </section>
      {offerCandidates?<div className="min-w-0"><PlacementOfferControls
        jobId={jobId}
        isTpo={hasMembershipRole(context, "TPO")}
        jobTitle={job.title}
        candidates={offerCandidates.map(
          (item) => ({
            applicationId:
              item.applicationId,
            displayName:
              item.displayName,
            email: item.email,
            roleTitle:
              item.roleTitle,
            offerReady:
              item.offerReady,
            offer: item.offer
              ? {
                  id: item.offer.id,
                  status:
                    item.offer.status as
                      | "ISSUED"
                      | "ACCEPTED"
                      | "DECLINED"
                      | "WITHDRAWN",
                  kind: item.offer.kind === "LOI" ? "LOI" : "OFFER",
                  roleTitle:
                    item.offer.roleTitle,
                  annualCtcInr:
                    item.offer.annualCtcInr,
                  joiningDate:
                    item.offer.joiningDate,
                  expiresAt:
                    item.offer.expiresAt?.toISOString() ??
                    null,
                  issuedAt:
                    item.offer.issuedAt.toISOString(),
                }
              : null,
            joining: item.joining
              ? {
                  status:
                    item.joining.status as
                      | "PENDING"
                      | "JOINED"
                      | "DID_NOT_JOIN"
                      | "DEFERRED",
                  joiningDate:
                    item.joining.joiningDate,
                  reason:
                    item.joining.reason,
                }
              : null,
          }),
        )}
      /></div>:<Alert tone="warning">Offers could not be refreshed. Offer statuses and issuance actions are unavailable.</Alert>}
    </div>
  );
}