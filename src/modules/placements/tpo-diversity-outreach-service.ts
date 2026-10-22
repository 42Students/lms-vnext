import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { activityEvents, membershipRoles, placementJobs } from "@/db/schema";
import { placementJobDiversityOutreach } from "@/db/schema/placement-diversity-outreach.staged";
import type { RequestContext } from "@/modules/identity/context";
import { hasMembershipRole } from "@/modules/identity/context";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { requireTpoJobCollege } from "./tpo-job-write-base";
import { PlacementsServiceError } from "./errors";

const uuid = z.string().uuid();
const draft = z.strictObject({
  action: z.literal("SAVE"),
  targetGender: z.enum(["FEMALE", "MALE", "NON_BINARY", "SELF_DESCRIBED"]),
  reason: z.string().trim().min(20).max(1000),
  expectedVersion: z.number().int().min(0),
});
const review = z.strictObject({
  action: z.enum(["APPROVE", "DISABLE"]),
  expectedVersion: z.number().int().min(1),
});
export type PrivateDiversityOutreach = {
  targetGender: "FEMALE" | "MALE" | "NON_BINARY" | "SELF_DESCRIBED";
  reason: string; status: "DRAFT" | "APPROVED" | "DISABLED";
  version: number;
};

/** Consent-based outreach may change who is INVITED to opt in; it must never
 * reject, downgrade or hide a learner job application. Nothing in this module
 * returns learner gender, and recruiters have no route to its data. */
export function diversityOutreachOnlyDecision(
  policy: PrivateDiversityOutreach | null,
  consentedSelfDescription: PrivateDiversityOutreach["targetGender"] | null,
): { outreach: boolean; eligibilityUnchanged: true } {
  return { outreach: policy?.status === "APPROVED" &&
    consentedSelfDescription === policy.targetGender,
    eligibilityUnchanged: true };
}
export class PrivateDiversityPolicyError extends Error {
  constructor(readonly code: "DIVERSITY_NOT_READY" | "DIVERSITY_ACCESS_DENIED") {
    super(code);
    this.name = "PrivateDiversityPolicyError";
  }
}
function requireReady() {
  if (process.env["DB10_DIVERSITY_OUTREACH_READY"] !== "PRIVACY_APPROVED")
    throw new PrivateDiversityPolicyError("DIVERSITY_NOT_READY");
}
type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
async function lockJob(tx: Tx, context: RequestContext, jobId: string, collegeId: string) {
  const [job] = await tx.select({
    id: placementJobs.id, title: placementJobs.title,
    collegeId: placementJobs.collegeId,
  }).from(placementJobs).where(and(
    eq(placementJobs.id, jobId), eq(placementJobs.collegeId, collegeId),
  )).for("update").limit(1);
  if (!job) throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  await assertPersistedPlatformPermission(tx, context, "placements.manage", { collegeId });
  return job;
}
async function audit(tx: Tx, context: RequestContext, jobId: string, status: string, version: number) {
  const membership = context.membership;
  if (!membership) throw new PrivateDiversityPolicyError("DIVERSITY_ACCESS_DENIED");
  await tx.insert(activityEvents).values({
    organizationId: membership.organizationId, collegeId: membership.collegeId,
    actorUserId: context.user.id, actorMembershipId: membership.id,
    module: "PLACEMENTS", eventType: "placements.diversity_outreach.reviewed",
    subjectType: "placement_job", subjectId: jobId,
    summary: "Private diversity outreach policy updated",
    metadata: { status, version, purpose: "OUTREACH_ONLY", genderOmitted: true },
  });
}
export async function readPrivateTpoDiversityOutreach(context: RequestContext, rawId: unknown) {
  requireReady();
  const jobId = uuid.parse(rawId);
  const collegeId = await requireTpoJobCollege(context);
  const [job] = await getDb().select({ id: placementJobs.id }).from(placementJobs)
    .where(and(eq(placementJobs.id, jobId), eq(placementJobs.collegeId, collegeId))).limit(1);
  if (!job) throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  const [policy] = await getDb().select({
    targetGender: placementJobDiversityOutreach.targetGender,
    reason: placementJobDiversityOutreach.reason,
    status: placementJobDiversityOutreach.status,
    version: placementJobDiversityOutreach.version,
  }).from(placementJobDiversityOutreach)
    .where(eq(placementJobDiversityOutreach.jobId, jobId)).limit(1);
  return { policy: policy ?? null, exclusiveAudience: "COLLEGE_TPO_ADMIN" as const };
}
export async function savePrivateTpoDiversityOutreach(
  context: RequestContext, rawId: unknown, raw: unknown,
) {
  requireReady();
  const input = draft.parse(raw);
  const jobId = uuid.parse(rawId);
  const collegeId = await requireTpoJobCollege(context);
  return getDb().transaction(async tx => {
    await lockJob(tx, context, jobId, collegeId);
    const [previous] = await tx.select().from(placementJobDiversityOutreach)
      .where(eq(placementJobDiversityOutreach.jobId, jobId)).for("update").limit(1);
    if ((previous?.version ?? 0) !== input.expectedVersion)
      throw new PlacementsServiceError("PLACEMENT_REQUEST_STALE");
    const now = new Date();
    const [saved] = previous ? await tx.update(placementJobDiversityOutreach).set({
      targetGender: input.targetGender, reason: input.reason,
      status: "DRAFT", version: sql`${placementJobDiversityOutreach.version} + 1`,
      approvedAt: null, approvedByUserId: null,
      createdByUserId: context.user.id, updatedAt: now,
    }).where(eq(placementJobDiversityOutreach.jobId, jobId))
      .returning({ version: placementJobDiversityOutreach.version })
      : await tx.insert(placementJobDiversityOutreach).values({
        jobId, targetGender: input.targetGender, reason: input.reason,
        createdByUserId: context.user.id, status: "DRAFT",
      }).returning({ version: placementJobDiversityOutreach.version });
    if (!saved) throw new PlacementsServiceError("PLACEMENT_REQUEST_STALE");
    await audit(tx, context, jobId, "DRAFT", saved.version);
    return { status: "DRAFT" as const, version: saved.version };
  });
}
export async function reviewPrivateTpoDiversityOutreach(
  context: RequestContext, rawId: unknown, raw: unknown,
) {
  requireReady();
  const input = review.parse(raw);
  if (!hasMembershipRole(context, "COLLEGE_ADMIN"))
    throw new PrivateDiversityPolicyError("DIVERSITY_ACCESS_DENIED");
  const jobId = uuid.parse(rawId);
  const collegeId = await requireTpoJobCollege(context);
  return getDb().transaction(async tx => {
    await lockJob(tx, context, jobId, collegeId);
    const member = context.membership;
    if (!member) throw new PrivateDiversityPolicyError("DIVERSITY_ACCESS_DENIED");
    const [approvedStaff] = await tx.select({ membershipId: membershipRoles.membershipId })
      .from(membershipRoles).where(and(eq(membershipRoles.membershipId, member.id),
        eq(membershipRoles.role, "COLLEGE_ADMIN"))).for("share").limit(1);
    if (!approvedStaff) throw new PrivateDiversityPolicyError("DIVERSITY_ACCESS_DENIED");
    const [previous] = await tx.select().from(placementJobDiversityOutreach)
      .where(eq(placementJobDiversityOutreach.jobId, jobId)).for("update").limit(1);
    if (!previous || previous.version !== input.expectedVersion)
      throw new PlacementsServiceError("PLACEMENT_REQUEST_STALE");
    if (input.action === "APPROVE" && (
      previous.status !== "DRAFT" || previous.createdByUserId === context.user.id))
      throw new PlacementsServiceError("PLACEMENT_REQUEST_CONFLICT");
    const nextStatus = input.action === "APPROVE" ? "APPROVED" : "DISABLED";
    const [updated] = await tx.update(placementJobDiversityOutreach).set({
      status: nextStatus,
      version: sql`${placementJobDiversityOutreach.version} + 1`,
      approvedByUserId: input.action === "APPROVE" ? context.user.id : previous.approvedByUserId,
      approvedAt: input.action === "APPROVE" ? new Date() : previous.approvedAt,
      updatedAt: new Date(),
    }).where(eq(placementJobDiversityOutreach.jobId, jobId))
      .returning({ version: placementJobDiversityOutreach.version });
    if (!updated) throw new PlacementsServiceError("PLACEMENT_REQUEST_STALE");
    await audit(tx, context, jobId, nextStatus, updated.version);
    return { status: nextStatus, version: updated.version };
  });
}
