import { Dropdown } from "@/components/ui/dropdown";
import { Disclosure } from "@/components/ui/disclosure";
import Link from "next/link";
import type { ReactNode } from "react";
import { ThirdPartyLink } from "@/components/ui/third-party-link";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Banner } from "@/components/ui/banner";
import { Alert } from "@/components/ui/alert";
import { listCohorts } from "@/modules/academics/cohort-service";
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
import { getPlacementJob } from "@/modules/placements/job-service";
import { listPlacementOfferCandidates } from "@/modules/placements/offer-service";
import { listPlacementScreeningQueue } from "@/modules/placements/screening-service";
import { getTpoScheduleConflicts } from "@/modules/placements/tpo-schedule-conflicts-service";
import { projectTpoDriveScheduleWarnings } from "@/modules/placements/tpo-drive-schedule-warnings-model";
import { getTpoDriveShortlist } from "@/modules/placements/tpo-shortlist-service";
import {countUnreleasedTpoSelections} from "@/modules/placements/tpo-drive-selection-service";
import { projectTpoDriveNextStep } from "@/modules/placements/tpo-drive-next-step-model";
import {projectTpoDriveHeader} from "@/modules/placements/tpo-drive-header-model";
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
  const [
    driveDay,
    evaluation,
    screening,
    job,
    eligibilityPolicy,
    offerCandidates,
    roleOptions,
    placementRequests,
  ] = await Promise.all([
    getPlacementDriveDay(context, jobId),
    getPlacementEvaluationConfig(context, jobId),
    listPlacementScreeningQueue(context, jobId),
    getPlacementJob(context, jobId),
    getJobEligibilityPolicy(context, jobId),
    listPlacementOfferCandidates(
      context,
      jobId,
    ),
    listPlacementRoleOptions(
      context,
      jobId,
    ),
    listPlacementJobRequests(
      context,
      jobId,
    ),
  ]);

  const jobTypes=job.status==="DRAFT"?await listPlacementJobTypeChoices(context,job.collegeId):[];
  const isTpo = hasMembershipRole(context,"TPO");
  const isSuperAdminDrive=applicationsHref?.startsWith("/admin/placements/jobs/")??false;
  const expiredPublished=job.status==="PUBLISHED"&&job.applicationDeadline!==null&&
    job.applicationDeadline.getTime()<Date.now();
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

  const programs =
    job.status === "DRAFT"
      ? await listPrograms(
          context,
          job.collegeId,
        )
      : [];

  const cohortGroups =
    job.status === "DRAFT"
      ? await Promise.all(
          programs.map(async (program) => ({
            program,
            cohorts: await listCohorts(
              context,
              program.id,
            ),
          })),
        )
      : [];

  const controlData: PlacementDriveControlData = {
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
  };

  const headerFacts = projectTpoDriveHeader({
    status:job.status,applicationMode:job.applicationMode,workMode:job.workMode,
    employmentType:job.employmentType,
    minimumAnnualCtcInr:job.minimumAnnualCtcInr,
    maximumAnnualCtcInr:job.maximumAnnualCtcInr,
    applicationDeadline:job.applicationDeadline,
    isDream:job.isDream,stipendPerMonthInr:job.stipendPerMonthInr,
  });

  const journey=isTpo?await getTpoDriveJourney(context,jobId):null;
  const pendingSelections=isTpo&&job.status==="PUBLISHED"
    ? await countUnreleasedTpoSelections(context,jobId) : 0;
  const reminderPreview=isTpo&&job.status==="PUBLISHED"
    ? await getTpoNonApplicantReminderPreview(context,jobId).catch(()=>null)
    : null;

  const nextStep = isTpo && lifecycleReadiness
    ? projectTpoDriveNextStep({
        jobId,
        status: job.status,
        publishAllowed: lifecycleReadiness.publish.allowed,
        closeAllowed: lifecycleReadiness.close.allowed,
        shortlistCount: shortlist?.total ?? null,
        applicantCount: journey?.stages.find(stage => stage.name === "Applied")?.count ?? 0,
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
        eyebrow={eyebrow}
        title={driveDay.job.company.name + " · " + driveDay.job.title}
        description={
          driveDay.job.company.name +
          " · " + (job.status==="PUBLISHED"?(expiredPublished?"Expired":"Open"):headerFacts.status)
        }
        actions={
          <div className="flex min-w-0 w-full flex-col gap-[var(--lms-space-2)] sm:w-auto sm:flex-row sm:items-center">
          {!isTpo ? <Link href={applicationsHref ?? "/college/placements/jobs/" + encodeURIComponent(jobId) + "/applications"} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] bg-[var(--lms-button-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] sm:w-auto md:min-h-9">{isSuperAdminDrive?"View applications":"Applications"}</Link> : null}
          {isSuperAdminDrive?<Link href={"/admin/placements/jobs/"+encodeURIComponent(jobId)+"/settings"}
             className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text sm:w-auto md:min-h-9">Edit drive</Link>:null}
          {isTpo&&nextStep?<Link href={nextStep.primary.href}
             className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-semibold text-primary-foreground sm:w-auto md:min-h-9">{nextStep.primary.label}</Link>:null}
          {isTpo?<Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/discussion"}
             className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text sm:w-auto md:min-h-9">Discussion</Link>:null}
          <Dropdown mobileSheet align="end" label="Drive actions" trigger="Actions" className="w-full sm:w-auto">
            <p className="hidden text-xs text-muted-foreground group-open:block md:!hidden leading-[20px]">Scroll for more drive actions ↓</p>
            <div role="group" aria-label="Drive action choices" tabIndex={0}
              className="flex max-h-[65dvh] min-w-0 flex-col gap-2 overflow-y-auto overscroll-contain pb-4 md:max-h-72 md:flex-col md:overflow-y-auto md:pb-0">
            {nextStep&&!isTpo ? (
              <Link href={nextStep.primary.href}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-4 text-sm font-[650] text-white hover:border-[var(--lms-button-primary-hover)] hover:bg-[var(--lms-button-primary-hover)] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[rgba(38,186,199,0.35)] min-[768px]:min-h-[var(--lms-control-height)]">
                {nextStep.primary.label}
              </Link>
            ) : null}
            {hasMembershipRole(context, "TPO") ? (
              <Link href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/applicants-pipeline"}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-3 text-sm font-semibold text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-[768px]:min-h-[var(--lms-control-height)]">
                Applicants
              </Link>
            ) : null}
            {isTpo && job.status === "PUBLISHED" ? (
              <Link href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/close-preview"}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-3 text-sm font-semibold text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-[768px]:min-h-[var(--lms-control-height)]">
                Close drive
              </Link>
            ) : null}
            {isTpo && (job.status === "DRAFT" || job.status === "PUBLISHED") ? (
              <Link href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/cancel-preview"}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-3 text-sm font-semibold text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-[768px]:min-h-[var(--lms-control-height)]">
                Cancel drive
              </Link>
            ) : null}
            {isTpo && job.status === "PUBLISHED" && job.applicationDeadline ? (
              <Link href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/extend-deadline"}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-3 text-sm font-semibold text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-[768px]:min-h-[var(--lms-control-height)]">
                Extend deadline
              </Link>
            ) : null}
            {isTpo ? <Dropdown align="end" label="More drive actions" trigger="More ▾">
              <div className="grid min-w-[min(14rem,calc(100vw_-_5rem))] max-w-full gap-2">
                <Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/applications-export"}
                  className="min-h-11 rounded-[6px] px-2 py-2 text-sm font-semibold text-[var(--lms-link-text)] hover:bg-[rgba(0,0,0,0.035)] active:bg-[rgba(0,0,0,0.06)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] transition-[background-color] duration-[200ms] ease-[ease] motion-reduce:transition-none">
                  Export applicants
                </Link>
                {job.status!=="DRAFT"?<Link
                  href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/share-preview"}
                  className="min-h-11 rounded-[6px] px-2 py-2 text-sm font-semibold text-[var(--lms-link-text)] hover:bg-[rgba(0,0,0,0.035)] active:bg-[rgba(0,0,0,0.06)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] transition-[background-color] duration-[200ms] ease-[ease] motion-reduce:transition-none">
                  Share with company
                </Link>:null}
                {["CLOSED","CANCELLED"].includes(job.status)
                  ? <TpoDriveCloneAction jobId={jobId} label="Run it again" /> : null}
              </div>
            </Dropdown>:null}
            {isTpo && job.status === "DRAFT" ? (
              <Link href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/edit"}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-3 text-sm font-semibold text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-[768px]:min-h-[var(--lms-control-height)]">
                Edit draft
              </Link>
            ) : null}
            {hasMembershipRole(context, "TPO") ? (
              <Link
                href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/shortlist"}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-3 text-sm font-semibold text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-[768px]:min-h-[var(--lms-control-height)]"
              >
                Current shortlist &amp; CSV
              </Link>
            ) : null}
            {hasMembershipRole(context, "TPO") ? (
              <Link
                href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/letters"}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-3 text-sm font-semibold text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-[768px]:min-h-[var(--lms-control-height)]"
              >
                Offer letter evidence
              </Link>
            ) : null}
            {hasMembershipRole(context, "TPO") ? (
              <Link
                href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/closeout"}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-3 text-sm font-semibold text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-[768px]:min-h-[var(--lms-control-height)]"
              >
                Drive close-out report
              </Link>
            ) : null}
            {hasMembershipRole(context, "TPO") ? (
              <Link
                href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/candidate-schedule"}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-3 text-sm font-semibold text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-[768px]:min-h-[var(--lms-control-height)]"
              >
                Candidate round schedule
              </Link>
            ) : null}
            {hasMembershipRole(context, "TPO") ? (
              <Link
                href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/joining"}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-3 text-sm font-semibold text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-[768px]:min-h-[var(--lms-control-height)]"
              >
                Manage joining outcomes
              </Link>
            ) : null}
            <Link
              href={isTpo
                ? "/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/applications-export"
                : "/api/placements/jobs/" + encodeURIComponent(jobId) + "/applicants/export"}
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-3 text-sm font-[650] text-white transition-colors hover:border-[var(--lms-button-primary-hover)] hover:bg-[var(--lms-button-primary-hover)] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[rgba(38,186,199,0.35)] min-[768px]:min-h-[var(--lms-control-height)]"
            >
              {isTpo ? "Review and export applicants" : "Export applicants (CSV)"}
            </Link>
            </div>
          </Dropdown>
          </div>
        }
      />
      {nextStep ? (
        <section aria-label="Next step" className="border-b border-border pb-4">
          <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Next step</h2>
          <p className="mt-2 text-sm text-body leading-[22px]">{nextStep.primary.description}</p>
          <Link href={nextStep.primary.href}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-semibold text-primary-foreground sm:w-auto md:min-h-9">
            {nextStep.primary.label}
          </Link>
          {nextStep.more.length > 0 ? (
            <div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {nextStep.more.map(step => (
                <Link key={step.href} href={step.href}
                  className="group inline-flex min-h-11 min-w-0 flex-col items-start justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-3 py-2 text-sm text-[var(--lms-link-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-[768px]:min-h-[var(--lms-control-height)]">
                  <span className="block font-semibold">{step.label}</span>
                  <span className="mt-1 block break-words text-xs text-body group-hover:text-white">{step.description}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
      {isTpo?<TpoDriveRefreshControl/>:null}
      {isTpo&&job.status==="DRAFT"?
       <TpoDeleteDraftAction jobId={jobId} updatedAt={job.updatedAt.toISOString()}/>:null}
      {isTpo&&!lifecycleReadiness?
       <Alert tone="warning">
        Could not load: Publication readiness. Publishing is unavailable until these checks recover.
        Refresh the drive to try again.
       </Alert>:null}
      <section aria-label="Drive status and details" className="min-w-0 border-b border-border pb-[var(--lms-space-4)]">
        <div className="flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)] text-sm">
          <StatusBadge tone={expiredPublished?"warning":job.status==="PUBLISHED"?"success":job.status==="DRAFT"?"warning":"neutral"}>
            {job.status==="PUBLISHED"?(expiredPublished?"Expired":"Open"):headerFacts.status}
           </StatusBadge>
          <span>{headerFacts.applicationMode}</span>
          <span>· {headerFacts.workMode}</span>
          <span>· {headerFacts.employmentType}</span>
          <StatusBadge tone="info">{headerFacts.category}</StatusBadge>
          {headerFacts.recordedOutside?<strong>Recorded: happened outside</strong>:null}
        </div>
        <div className="mt-[var(--lms-space-2)] flex min-w-0 flex-wrap gap-x-[var(--lms-space-4)] gap-y-[var(--lms-space-2)] text-sm text-body">
          <span>Pay: {headerFacts.ctc}</span>
          <span>Applications close: {headerFacts.deadline}</span>
        </div>
      </section>
      {overview}
      {job.legacyPostingDetails&&(job.legacyPostingDetails.portal?.studentsRegisterSeparately||
        job.legacyPostingDetails.campusPool?.hostCollege||
        job.legacyPostingDetails.campusPool?.reportingTime||
        job.legacyPostingDetails.campusPool?.travelNote||
        job.legacyPostingDetails.skillsWanted?.length)?(
        <section aria-label="Supplementary employer details" className="min-w-0 border-b border-border pb-4">
          <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Employer information</h2>
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
            <p className="mt-2 text-sm text-body leading-[22px]">Pool reporting time (IST): {new Intl.DateTimeFormat("en-IN",
              {dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(
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
      {journey?<section aria-label="Drive applicant journey" className="min-w-0 border-b border-border pb-4">
        <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Journey</h2>
        <p className="mt-1 text-xs text-body leading-[20px]">{journey.definition}</p>
        <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border md:grid-cols-3 xl:grid-cols-6">
          {journey.stages.map(stage=><Link key={stage.name} href={stage.href}
            className="min-w-0 border-b border-r border-border p-3 text-foreground hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--lms-primary)] even:border-r-0 md:even:border-r md:[&:nth-child(3n)]:border-r-0 xl:[&:nth-child(3n)]:border-r xl:border-b-0 xl:last:border-r-0">
            <span className="block text-xs text-body">{stage.name}</span>
            <strong className="mt-2 block text-2xl tabular-nums">{stage.count}</strong>
          </Link>)}
        </div>
        <p className="mt-3 text-xs text-body leading-[20px]">{journey.excluded} registered learners excluded or not notified from {journey.considered} considered.</p>
      </section>:null}
      {isTpo && driveDay.rounds.length > 0 ? (
        <section aria-label="Round journey" className="min-w-0 border-b border-border pb-4">
          <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Rounds</h2>
          <p className="mt-1 text-sm text-body leading-[22px]">Round status, schedule and outcome progress. Open a round to see who has reached it.</p>
          <div className="mt-3 divide-y divide-border">
            {driveDay.rounds.map(round => {
              const staged = round.participants.filter(p => p.result?.status === "STAGED").length;
              const applied = round.participants.filter(p => p.result?.status === "APPLIED").length;
              const rescheduleRequests=placementRequests.filter(row=>
                row.request.status==="PENDING"&&row.request.requestType==="ROUND_RESCHEDULE"&&
                row.request.roundId===round.id).length;
              return (
                <article key={round.id} className="min-w-0 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="min-w-0 break-words text-base font-semibold leading-6 text-foreground">{round.sequence}. {round.name}</h3>
                    <StatusBadge tone={round.status==="COMPLETED"?"success":round.status==="CANCELLED"?"error":round.status==="SCHEDULED"?"info":"warning"}>{round.status}</StatusBadge>
                  </div>
                  <dl className="mt-3 grid min-w-0 gap-3 text-sm text-body sm:grid-cols-2">
                    <div><dt className="font-semibold">When</dt><dd>{round.scheduledAt
                      ? new Intl.DateTimeFormat("en-IN", {timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(round.scheduledAt)+" IST"
                      : "Date to be decided"}</dd></div>
                    <div><dt className="font-semibold">Mode and place</dt>
                      <dd>{round.mode==="VIRTUAL"?"Online":round.mode==="ON_CAMPUS"?"On campus":(round.mode??"").replaceAll("_"," ")}
                        {" · "}{round.venue??(round.meetingUrl?"Online":"Venue to be told")}
                        {round.meetingUrl&&/^https:\/\//i.test(round.meetingUrl)?<ThirdPartyLink href={round.meetingUrl} label="Meeting link"/>:null}
                      </dd>
                    </div>
                    <div><dt className="font-semibold">Students in round</dt><dd>{round.participants.length}</dd></div>
                    <div><dt className="font-semibold">Results</dt><dd>{applied} applied · {staged} awaiting apply · {Math.max(0,round.participants.length-applied-staged)} not recorded</dd></div>
                    <div><dt className="font-semibold">Reschedule requests</dt><dd>{rescheduleRequests}
                      {rescheduleRequests>0?<Link href="#drive-request-actions"
                        className="ml-2 font-semibold text-[var(--lms-link-text)] underline max-[767px]:inline-flex max-[767px]:min-h-11 max-[767px]:items-center">Review pending →</Link>:null}
                    </dd></div>
                    <div><dt className="font-semibold">Results expected</dt><dd>{round.resultsDueAt
                      ? new Intl.DateTimeFormat("en-IN", {timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(round.resultsDueAt)+" IST"
                      : "Not set"}</dd></div>
                    <div><dt className="font-semibold">Duration</dt><dd>{round.durationMinutes ? round.durationMinutes+" minutes" : "Not specified"}</dd></div>
                  </dl>
                  {round.platform ? <p className="mt-2 text-sm text-body leading-[22px]">Platform: {round.platform}</p> : null}
                  {round.testUrl&&/^https:\/\//i.test(round.testUrl)?<ThirdPartyLink href={round.testUrl} label="Open test instructions →"/>:null}
                  {round.whatToBring ? <p className="mt-1 text-sm text-body leading-[22px]">Bring: {round.whatToBring}</p> : null}
                  <div className="mt-3 flex min-w-0 flex-col gap-2 text-sm sm:flex-row sm:flex-wrap">
                    <Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/candidate-schedule?roundId="+encodeURIComponent(round.id)}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 font-semibold text-[var(--lms-link-text)] underline sm:w-auto md:min-h-9">See who reached this round →</Link>
                    {round.kind !== "TALK" ? <Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/rounds/"+encodeURIComponent(round.id)+"/results"}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 font-semibold text-[var(--lms-link-text)] underline sm:w-auto md:min-h-9">Enter results →</Link> : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
      {isTpo && driveDay.rounds.length>0 ? (
        <details className="group min-w-0 border-b border-border pb-4">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-[var(--lms-link-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">Enter round results <span aria-hidden="true" className="text-muted-foreground group-open:rotate-180">⌄</span></summary>
          <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
            {driveDay.rounds.filter(round=>round.kind!=="TALK").map(round=>
              <Link key={round.id}
                href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/rounds/"+encodeURIComponent(round.id)+"/results"}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-semibold text-[var(--lms-link-text)] sm:w-auto hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-[768px]:min-h-[var(--lms-control-height)]">
                {round.name}
              </Link>)}
          </div>
        </details>
      ) : null}
      {isTpo ? (
        <section
          aria-label="Current screening shortlist"
          className="min-w-0 border-b border-border pb-4"
        >
          <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">
            Persisted screening shortlist
          </h2>
          <p className="mt-2 text-sm text-body leading-[22px]">
            {shortlist
              ? String(shortlist.total) + " currently shortlisted submitted application(s). " +
                "This is an application count, not a unique learner count."
              : "Current shortlist could not be loaded. No count is inferred."}
          </p>
          <div className="mt-3 flex min-w-0 flex-col gap-2 text-sm sm:flex-row sm:flex-wrap">
            <Link
              href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/shortlist"}
              className="inline-flex min-h-11 w-full items-center justify-center font-semibold text-[var(--lms-link-text)] hover:underline sm:w-auto md:min-h-9"
            >
              View persisted shortlist →
            </Link>
            <a
              href={"/api/placements/jobs/" + encodeURIComponent(jobId) + "/shortlist/export"}
              className="inline-flex min-h-11 w-full items-center justify-center font-semibold text-[var(--lms-link-text)] hover:underline sm:w-auto md:min-h-9"
            >
              Download formula-safe shortlist CSV
            </a>
          </div>
        </section>
      ) : null}
      {job.status === "DRAFT" ? (
        <PlacementDraftEditForm
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
            },
            policy: {
              allowedProgramIds:
                eligibilityPolicy.allowedProgramIds,
              allowedCohortIds:
                eligibilityPolicy.allowedCohortIds,
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
        />
      ) : null}
      <PlacementRoleOptions
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
      />
      {isTpo&&job.status==="PUBLISHED"&&!bulkCandidates?
       <Alert tone="warning">
        Could not load: Bulk applicants. Other drive sections are still available.
        Refresh the drive to retry this section.
       </Alert>:null}
      {bulkCandidates ? (
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
        <h2 className="mb-2 font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Registered, not applied</h2>
        <p className="mb-3 text-sm text-body leading-[22px]">{reminderPreview && reminderPreview.allowed
          ? reminderPreview.count+" eligible registered students have not applied. Remind once per day, before the deadline."
          : "Remind eligible registered students who have not applied. Once per day, and only before the deadline."}</p>
        <TpoRemindNonApplicants jobId={jobId}/>
      </section>:null}
      <section id="drive-request-actions" className="min-w-0"> 
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
      </section>
      {lifecycleReadiness ? (
        <TpoDriveLifecycleControls readiness={lifecycleReadiness} initialPublish={openPublish} />
      ) : (
        <PlacementJobLifecycleControls
          jobId={jobId}
          status={driveDay.job.status as
            | "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED"}
        />
      )}
      <details className="group min-w-0 border-b border-border pb-4">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-[var(--lms-link-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
          Drive day overview <span aria-hidden="true" className="text-muted-foreground group-open:rotate-180">⌄</span>
        </summary>
        <div className="pt-3"><PlacementDriveDayOverview driveDay={driveDay} embedded /></div>
      </details>
      {roundOrder?<TpoRoundReorder jobId={jobId} readiness={roundOrder}/>:null}
      <section id="drive-round-actions" className="min-w-0">
      <PlacementDriveControls
        data={controlData}
        scheduleWarnings={scheduleWarnings}
      />
      </section>
      <div className="min-w-0"><PlacementOfferControls
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
      /></div>
    </div>
  );
}