import { PageHeader } from "@/components/ui/page-header";
import type { RequestContext } from "@/modules/identity/context";
import { getPlacementDriveDay } from "@/modules/placements/drive-day-service";
import { getPlacementEvaluationConfig } from "@/modules/placements/evaluation-config-service";
import { listPlacementScreeningQueue } from "@/modules/placements/screening-service";
import { PlacementDriveDayOverview } from "./placement-drive-day-overview";
import { PlacementJobLifecycleControls } from "./placement-job-lifecycle-controls";
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
  const [driveDay, evaluation, screening] =
    await Promise.all([
      getPlacementDriveDay(context, jobId),
      getPlacementEvaluationConfig(context, jobId),
      listPlacementScreeningQueue(context, jobId),
    ]);

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
      status:
        item.screening.status as PlacementDriveControlData["screening"][number]["status"],
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
    </div>
  );
}