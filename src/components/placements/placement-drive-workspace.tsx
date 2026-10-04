import { PageHeader } from "@/components/ui/page-header";
import { listCohorts } from "@/modules/academics/cohort-service";
import { listPrograms } from "@/modules/academics/program-service";
import type { RequestContext } from "@/modules/identity/context";
import { getPlacementDriveDay } from "@/modules/placements/drive-day-service";
import { getJobEligibilityPolicy } from "@/modules/placements/eligibility-service";
import { getPlacementEvaluationConfig } from "@/modules/placements/evaluation-config-service";
import { getPlacementJob } from "@/modules/placements/job-service";
import { listPlacementOfferCandidates } from "@/modules/placements/offer-service";
import { listPlacementScreeningQueue } from "@/modules/placements/screening-service";
import { listPlacementJobRequests } from "@/modules/placements/request-service";
import { listPlacementRoleOptions } from "@/modules/placements/role-option-service";
import { PlacementDraftEditForm } from "./placement-draft-edit-form";
import { PlacementDriveDayOverview } from "./placement-drive-day-overview";
import { PlacementJobLifecycleControls } from "./placement-job-lifecycle-controls";
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
}: {
  context: RequestContext;
  jobId: string;
  eyebrow: string;
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={driveDay.job.title}
        description={
          driveDay.job.company.name +
          " · live placement workspace"
        }
      />
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
      <PlacementJobLifecycleControls
        jobId={jobId}
        status={
          driveDay.job.status as
            | "DRAFT"
            | "PUBLISHED"
            | "CLOSED"
            | "ARCHIVED"
        }
      />
      <PlacementDriveDayOverview
        driveDay={driveDay}
      />
      <PlacementDriveControls
        data={controlData}
      />
      <PlacementOfferControls
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