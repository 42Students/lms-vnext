import Link from "next/link";
import { ThirdPartyLink } from "@/components/ui/third-party-link";
import { PageHeader } from "@/components/ui/page-header";
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
}: {
  context: RequestContext;
  jobId: string;
  eyebrow: string;
  openPublish?: boolean;
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

  const isTpo = hasMembershipRole(context,"TPO");
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
    <div className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={driveDay.job.company.name + " · " + driveDay.job.title}
        description={
          driveDay.job.company.name +
          " · " + headerFacts.status
        }
        actions={
          <details className="group relative w-full md:w-auto" aria-label="Drive actions">
            <summary className="flex min-h-11 cursor-pointer items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-[var(--lms-link-text)] md:hidden md:min-h-9">Actions</summary>
            <p className="hidden text-xs text-muted-foreground group-open:block md:!hidden">Scroll for more drive actions ↓</p>
            <div role="group" aria-label="Drive action choices" tabIndex={0}
              className="hidden max-h-[65dvh] min-w-0 flex-col gap-2 overflow-y-auto overscroll-contain rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 pb-7 group-open:flex md:flex md:max-h-none md:flex-row md:flex-wrap md:overflow-visible md:border-0 md:p-0 [mask-image:linear-gradient(to_bottom,#000_0%,#000_calc(100%-1.25rem),transparent_100%)] md:[mask-image:none]">
            {nextStep ? (
              <Link href={nextStep.primary.href}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-primary bg-primary px-4 text-sm font-semibold text-primary-foreground md:min-h-9">
                {nextStep.primary.label}
              </Link>
            ) : null}
            {hasMembershipRole(context, "TPO") ? (
              <Link href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/applicants-pipeline"}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-foreground md:min-h-9">
                Applicants
              </Link>
            ) : null}
            {isTpo && job.status === "PUBLISHED" ? (
              <Link href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/close-preview"}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-foreground md:min-h-9">
                Close drive
              </Link>
            ) : null}
            {isTpo && (job.status === "DRAFT" || job.status === "PUBLISHED") ? (
              <Link href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/cancel-preview"}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-foreground md:min-h-9">
                Cancel drive
              </Link>
            ) : null}
            {isTpo && job.status === "PUBLISHED" && job.applicationDeadline ? (
              <Link href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/extend-deadline"}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-foreground md:min-h-9">
                Extend deadline
              </Link>
            ) : null}
            {isTpo ? <details className="relative self-start">
              <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-foreground md:min-h-9">
                More ▾
              </summary>
              <div className="absolute right-0 z-20 mt-1 grid min-w-56 gap-2 rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 shadow-[0_14px_16px_rgba(0,0,0,0.04)]">
                <Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/applications-export"}
                  className="min-h-9 rounded-[var(--lms-control-radius)] px-2 py-2 text-sm font-semibold text-[var(--lms-link-text)] hover:bg-[var(--lms-primary-subtle)] hover:text-[var(--lms-primary-text)] md:min-h-9">
                  Export applicants
                </Link>
                {job.status!=="DRAFT"?<Link
                  href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/share-preview"}
                  className="min-h-9 rounded-[var(--lms-control-radius)] px-2 py-2 text-sm font-semibold text-[var(--lms-link-text)] hover:bg-[var(--lms-primary-subtle)] hover:text-[var(--lms-primary-text)] md:min-h-9">
                  Share with company
                </Link>:null}
                {["CLOSED","CANCELLED"].includes(job.status)
                  ? <TpoDriveCloneAction jobId={jobId} label="Run it again" /> : null}
              </div>
            </details>:null}
            {isTpo && job.status === "DRAFT" ? (
              <Link href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/edit"}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-foreground md:min-h-9">
                Edit draft
              </Link>
            ) : null}
            {hasMembershipRole(context, "TPO") ? (
              <Link
                href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/shortlist"}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-foreground md:min-h-9"
              >
                Current shortlist &amp; CSV
              </Link>
            ) : null}
            {hasMembershipRole(context, "TPO") ? (
              <Link
                href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/letters"}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-foreground md:min-h-9"
              >
                Offer letter evidence
              </Link>
            ) : null}
            {hasMembershipRole(context, "TPO") ? (
              <Link
                href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/closeout"}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-foreground md:min-h-9"
              >
                Drive close-out report
              </Link>
            ) : null}
            {hasMembershipRole(context, "TPO") ? (
              <Link
                href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/candidate-schedule"}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-foreground md:min-h-9"
              >
                Candidate round schedule
              </Link>
            ) : null}
            {hasMembershipRole(context, "TPO") ? (
              <Link
                href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/joining"}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-foreground md:min-h-9"
              >
                Manage joining outcomes
              </Link>
            ) : null}
            <Link
              href={isTpo
                ? "/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/applications-export"
                : "/api/placements/jobs/" + encodeURIComponent(jobId) + "/applicants/export"}
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-primary bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:border-primary-hover hover:bg-[var(--lms-button-primary-hover)] md:min-h-9"
            >
              {isTpo ? "Review and export applicants" : "Export applicants (CSV)"}
            </Link>
            </div>
          </details>
        }
      />
      {isTpo?<TpoDriveRefreshControl/>:null}
      {isTpo&&job.status==="DRAFT"?
       <TpoDeleteDraftAction jobId={jobId} updatedAt={job.updatedAt.toISOString()}/>:null}
      {isTpo&&!lifecycleReadiness?
       <p role="status" className="rounded-[var(--lms-control-radius)] border border-border p-3 text-sm text-body">
        Could not load: Publication readiness. Publishing is unavailable until these checks recover.
        Refresh the drive to try again.
       </p>:null}
      <section aria-label="Drive status and details" className="border-b border-border pb-6">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <strong className="rounded-[var(--lms-control-radius)] border border-border bg-muted px-2 py-1">{headerFacts.status}</strong>
          <span>{headerFacts.applicationMode}</span>
          <span>· {headerFacts.workMode}</span>
          <span>· {headerFacts.employmentType}</span>
          <strong className="rounded-[var(--lms-control-radius)] border border-border px-2 py-1">{headerFacts.category}</strong>
          {headerFacts.recordedOutside?<strong>Recorded: happened outside</strong>:null}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-body">
          <span>Pay: {headerFacts.ctc}</span>
          <span>Applications close: {headerFacts.deadline}</span>
        </div>
      </section>
      {job.legacyPostingDetails&&(job.legacyPostingDetails.portal?.studentsRegisterSeparately||
        job.legacyPostingDetails.campusPool?.hostCollege||
        job.legacyPostingDetails.campusPool?.reportingTime||
        job.legacyPostingDetails.campusPool?.travelNote||
        job.legacyPostingDetails.skillsWanted?.length)?(
        <section aria-label="Supplementary employer details" className="border-b border-border pb-6">
          <h2 className="font-semibold text-foreground">Employer information</h2>
          {job.legacyPostingDetails.portal?.studentsRegisterSeparately?(
            <p className="mt-2 text-sm text-body">
              Students also register on {job.legacyPostingDetails.portal.name}.
              {/^https:\/\/[^/]+/i.test(job.legacyPostingDetails.portal.url)?(
                <>{" "}<ThirdPartyLink href={job.legacyPostingDetails.portal.url} label="Open employer portal"/></>
              ):null}
            </p>
          ):null}
          {job.legacyPostingDetails.campusPool?.hostCollege?(
            <p className="mt-2 text-sm text-body">Pool host: {job.legacyPostingDetails.campusPool.hostCollege}</p>
          ):null}
          {job.legacyPostingDetails.campusPool?.reportingTime?(
            <p className="mt-2 text-sm text-body">Pool reporting time (IST): {new Intl.DateTimeFormat("en-IN",
              {dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(
                new Date(job.legacyPostingDetails.campusPool.reportingTime))}</p>
          ):null}
          {job.legacyPostingDetails.campusPool?.travelNote?(
            <p className="mt-2 whitespace-pre-wrap text-sm text-body">Travel: {job.legacyPostingDetails.campusPool.travelNote}</p>
          ):null}
          {job.legacyPostingDetails.skillsWanted?.length?(
            <p className="mt-2 text-sm text-body">Requested skills: {job.legacyPostingDetails.skillsWanted.join(", ")}</p>
          ):null}
          <p className="mt-2 text-xs text-muted-foreground">Supplementary details do not automatically create a venue, travel booking or eligibility rule.</p>
        </section>
      ):null}
      {deadlineState?.extendable?(
        <section id="drive-deadline-actions" aria-label="Set or extend deadline"
          className="border-b border-border pb-6">
          <details>
            <summary className="cursor-pointer font-semibold text-[var(--lms-link-text)]">
              {deadlineState.applicationDeadline?"Extend deadline":"Set deadline"}
            </summary>
            <div className="mt-4"><TpoDriveDeadlineForm job={deadlineState}/></div>
          </details>
        </section>
      ):null}
      {nextStep ? (
        <section aria-label="Next step" className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5">
          <h2 className="text-base font-semibold text-foreground">Next step</h2>
          <p className="mt-2 text-sm text-body">{nextStep.primary.description}</p>
          <Link href={nextStep.primary.href}
            className="mt-3 inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-semibold text-primary-foreground md:min-h-9">
            {nextStep.primary.label}
          </Link>
          {nextStep.more.length > 0 ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {nextStep.more.map(step => (
                <Link key={step.href} href={step.href}
                  className="rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2 text-sm text-[var(--lms-link-text)] hover:border-primary hover:underline">
                  <span className="block font-semibold">{step.label}</span>
                  <span className="mt-1 block text-xs text-body">{step.description}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
      {journey?<section aria-label="Drive applicant journey" className="border-b border-border pb-6">
        <h2 className="font-semibold text-foreground">Journey</h2>
        <p className="mt-1 text-xs text-body">{journey.definition}</p>
        <div className="mt-4 grid overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border sm:grid-cols-3 lg:grid-cols-6">
          {journey.stages.map(stage=><Link key={stage.name} href={stage.href}
            className="border-b border-border p-3 text-foreground hover:bg-primary-subtle sm:border-r sm:border-b-0 sm:last:border-r-0">
            <span className="block text-xs text-body">{stage.name}</span>
            <strong className="mt-2 block text-2xl tabular-nums">{stage.count}</strong>
          </Link>)}
        </div>
        <p className="mt-3 text-xs text-body">{journey.excluded} registered learners excluded or not notified from {journey.considered} considered.</p>
      </section>:null}
      {isTpo && driveDay.rounds.length > 0 ? (
        <section aria-label="Round journey" className="border-b border-border pb-6">
          <h2 className="text-base font-semibold text-foreground">Rounds</h2>
          <p className="mt-1 text-sm text-body">Round status, schedule and outcome progress. Open a round to see who has reached it.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {driveDay.rounds.map(round => {
              const staged = round.participants.filter(p => p.result?.status === "STAGED").length;
              const applied = round.participants.filter(p => p.result?.status === "APPLIED").length;
              const rescheduleRequests=placementRequests.filter(row=>
                row.request.status==="PENDING"&&row.request.requestType==="ROUND_RESCHEDULE"&&
                row.request.roundId===round.id).length;
              return (
                <article key={round.id} className="border-b border-border py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-foreground">{round.sequence}. {round.name}</h3>
                    <span className="rounded-[var(--lms-control-radius)] border border-border px-2 py-1 text-xs font-semibold">{round.status}</span>
                  </div>
                  <dl className="mt-3 grid gap-2 text-sm text-body sm:grid-cols-2">
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
                        className="ml-2 font-semibold text-[var(--lms-link-text)] underline">Review pending →</Link>:null}
                    </dd></div>
                    <div><dt className="font-semibold">Results expected</dt><dd>{round.resultsDueAt
                      ? new Intl.DateTimeFormat("en-IN", {timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(round.resultsDueAt)+" IST"
                      : "Not set"}</dd></div>
                    <div><dt className="font-semibold">Duration</dt><dd>{round.durationMinutes ? round.durationMinutes+" minutes" : "Not specified"}</dd></div>
                  </dl>
                  {round.platform ? <p className="mt-2 text-sm text-body">Platform: {round.platform}</p> : null}
                  {round.testUrl&&/^https:\/\//i.test(round.testUrl)?<ThirdPartyLink href={round.testUrl} label="Open test instructions →"/>:null}
                  {round.whatToBring ? <p className="mt-1 text-sm text-body">Bring: {round.whatToBring}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/candidate-schedule?roundId="+encodeURIComponent(round.id)}
                      className="font-semibold text-[var(--lms-link-text)] underline">See who reached this round →</Link>
                    {round.kind !== "TALK" ? <Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/rounds/"+encodeURIComponent(round.id)+"/results"}
                      className="font-semibold text-[var(--lms-link-text)] underline">Enter results →</Link> : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
      {isTpo && driveDay.rounds.length>0 ? (
        <section aria-label="Round result entry" className="border-b border-border pb-6">
          <h2 className="font-semibold text-foreground">Enter round results</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {driveDay.rounds.filter(round=>round.kind!=="TALK").map(round=>
              <Link key={round.id}
                href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/rounds/"+encodeURIComponent(round.id)+"/results"}
                className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-[var(--lms-link-text)] md:min-h-9">
                {round.name}
              </Link>)}
          </div>
        </section>
      ) : null}
      {isTpo ? (
        <section
          aria-label="Current screening shortlist"
          className="border-b border-border pb-6"
        >
          <h2 className="text-base font-semibold text-foreground">
            Persisted screening shortlist
          </h2>
          <p className="mt-2 text-sm text-body">
            {shortlist
              ? String(shortlist.total) + " currently shortlisted submitted application(s). " +
                "This is an application count, not a unique learner count."
              : "Current shortlist could not be loaded. No count is inferred."}
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <Link
              href={"/tpo/placements/jobs/" + encodeURIComponent(jobId) + "/shortlist"}
              className="font-semibold text-[var(--lms-link-text)] hover:underline"
            >
              View persisted shortlist →
            </Link>
            <a
              href={"/api/placements/jobs/" + encodeURIComponent(jobId) + "/shortlist/export"}
              className="font-semibold text-[var(--lms-link-text)] hover:underline"
            >
              Download formula-safe shortlist CSV
            </a>
          </div>
        </section>
      ) : null}
      {job.status === "DRAFT" ? (
        <PlacementDraftEditForm
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
       <p role="status" className="rounded-[var(--lms-control-radius)] border border-border p-3 text-sm text-body">
        Could not load: Bulk applicants. Other drive sections are still available.
        Refresh the drive to retry this section.
       </p>:null}
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
        className="border-b border-border pb-6">
        <h2 className="mb-2 font-semibold text-foreground">Registered, not applied</h2>
        <p className="mb-3 text-sm text-body">{reminderPreview && reminderPreview.allowed
          ? reminderPreview.count+" eligible registered students have not applied. Remind once per day, before the deadline."
          : "Remind eligible registered students who have not applied. Once per day, and only before the deadline."}</p>
        <TpoRemindNonApplicants jobId={jobId}/>
      </section>:null}
      <section id="drive-request-actions">
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
      <PlacementDriveDayOverview
        driveDay={driveDay}
      />
      {roundOrder?<TpoRoundReorder jobId={jobId} readiness={roundOrder}/>:null}
      <section id="drive-round-actions">
      <PlacementDriveControls
        data={controlData}
        scheduleWarnings={scheduleWarnings}
      />
      </section>
      <PlacementOfferControls
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
      />
    </div>
  );
}