import "server-only";
import type { RequestContext } from "@/modules/identity/context";
import {
  findUnchosenEligibleBatchStudents,
  markPlacementBatchInvited,
  upsertPlacementBatchSettings,
} from "./batch-participation-service";
import { getDb } from "@/db/client";
import { getTpoBatch } from "./tpo-batch-workspace-read-service";
import {
  registrationDeadlineAtEndOfDay,
  TpoBatchInvitationError,
  tpoBatchInvitationSchema,
  tpoBatchDeadlineSchema,
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
  const { collegeId, lifecycle, ready } = await getTpoBatch(ctx, batchId);
  if (!ready) throw new TpoBatchInvitationError("ELIGIBILITY_INCOMPLETE");
  if (lifecycle?.finishedAt) throw new TpoBatchInvitationError("BATCH_FINISHED");
  if (lifecycle?.invitedAt) throw new TpoBatchInvitationError("BATCH_ALREADY_INVITED");
  const invited = await markPlacementBatchInvited(ctx, {
    collegeId, cohortId: batchId, registrationDeadline: deadline,
    expectedVersion: input.expectedVersion,
  });
  return { invitedAt: invited.invitedAt?.toISOString() ?? null,
    deadline: invited.registrationDeadline?.toISOString() ?? null,
    notifiedCount: invited.notifiedCount,
    delivery: "APP_RECORDED_EMAIL_NOT_SENT" as const };
}

/**
 * Update, clear or reopen the date without replacing any batch-level rules.
 * This keeps the existing invitedAt intact. Reopening the window does not
 * claim that a recruiter/student notification was delivered.
 */
export async function saveTpoBatchRegistrationDeadline(
  ctx: RequestContext, batchId: string, raw: unknown,
) {
  const input = tpoBatchDeadlineSchema.parse(raw);
  const deadline = input.deadline === null ? null :
    registrationDeadlineAtEndOfDay(input.deadline, new Date());
  const { collegeId, lifecycle, ready } = await getTpoBatch(ctx, batchId);
  if (!ready) throw new TpoBatchInvitationError("ELIGIBILITY_INCOMPLETE");
  if (lifecycle?.finishedAt) throw new TpoBatchInvitationError("BATCH_FINISHED");
  const saved = await upsertPlacementBatchSettings(ctx, {
    collegeId, cohortId: batchId, registrationDeadline: deadline,
    rulesOverride: lifecycle?.rulesOverride ?? null,
    expectedVersion: input.expectedVersion,
  });
  if (!saved) throw new Error("BATCH_SETTINGS_NOT_SAVED");
  return {
    deadline: saved.registrationDeadline?.toISOString() ?? null,
    invitedAt: saved.invitedAt?.toISOString() ?? null,
    delivery: "APP_ON_REOPEN_EMAIL_NOT_SENT" as const,
    version: saved.updatedAt.toISOString(),
  };
}

/**
 * Exact full-cohort preview, including learner > class > batch overrides,
 * multiple-class ambiguity and existing outcome/application exclusions.
 * Unlike the dashboard's intentionally capped snapshot, this does not
 * silently declare cohorts over 500 learners ineligible for invitations.
 */
export async function getTpoBatchInvitationPreview(ctx: RequestContext, batchId: string) {
  const { collegeId, ready } = await getTpoBatch(ctx, batchId);
  if (!ready) throw new TpoBatchInvitationError("ELIGIBILITY_INCOMPLETE");
  const count = await getDb().transaction(async tx =>
    (await findUnchosenEligibleBatchStudents(tx, collegeId, batchId)).length,
    { accessMode: "read only" },
  );
  const eligible = await getDb().transaction(async tx =>
    (await findUnchosenEligibleBatchStudents(tx, collegeId, batchId, true)).length,
    { accessMode: "read only" },
  );
  return { invitable: count, eligible };
}
