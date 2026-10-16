import "server-only";
import type { RequestContext } from "@/modules/identity/context";
import {
  markPlacementBatchInvited,
  upsertPlacementBatchSettings,
} from "./batch-participation-service";
import { getTpoBatch } from "./tpo-batch-workspace-read-service";
import { getTpoBatchEligibilitySummary } from "./tpo-batch-eligibility-summary-service";
import { getTpoBatchRegistrationSummary } from "./tpo-batch-registration-summary-service";
import {
  registrationDeadlineAtEndOfDay,
  TpoBatchInvitationError,
  tpoBatchInvitationSchema,
} from "./tpo-batch-invitation-model";

/**
 * Persist registration settings and open the learner registration window.
 * This is an invitation-state transition, NOT evidence of SMS/email delivery.
 * Downstream delivery must be implemented separately before claiming that
 * students were told (TPO-batches-18 notification parity).
 */
export async function inviteTpoBatch(
  ctx: RequestContext, batchId: string, raw: unknown,
) {
  const input = tpoBatchInvitationSchema.parse(raw);
  const deadline = registrationDeadlineAtEndOfDay(input.deadline, new Date());
  const [{ collegeId, lifecycle, ready }, eligibility, registrations] = await Promise.all([
    getTpoBatch(ctx, batchId),
    getTpoBatchEligibilitySummary(ctx, batchId),
    getTpoBatchRegistrationSummary(ctx, batchId),
  ]);
  if (!ready) throw new TpoBatchInvitationError("ELIGIBILITY_INCOMPLETE");
  if (lifecycle?.finishedAt) throw new TpoBatchInvitationError("BATCH_FINISHED");
  if (lifecycle?.invitedAt) throw new TpoBatchInvitationError("BATCH_ALREADY_INVITED");
  if (!eligibility.summary.complete || eligibility.summary.needsReview > 0)
    throw new TpoBatchInvitationError("ELIGIBILITY_INCOMPLETE");
  if (eligibility.summary.eligible === 0)
    throw new TpoBatchInvitationError("NO_ELIGIBLE_STUDENTS");
  if (!registrations.available)
    throw new TpoBatchInvitationError("ELIGIBILITY_INCOMPLETE");
  if (registrations.unrecorded === 0)
    throw new TpoBatchInvitationError("EVERYONE_REGISTERED");

  await upsertPlacementBatchSettings(ctx, {
    collegeId, cohortId: batchId, registrationDeadline: deadline,
    rulesOverride: lifecycle?.rulesOverride ?? null,
    expectedVersion: input.expectedVersion,
  });
  const invited = await markPlacementBatchInvited(ctx, { collegeId, cohortId: batchId });
  return { invitedAt: invited.invitedAt?.toISOString() ?? null,
    deadline: invited.registrationDeadline?.toISOString() ?? null,
    delivery: "NOT_SENT" as const };
}
