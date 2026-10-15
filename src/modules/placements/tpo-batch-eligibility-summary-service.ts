import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships, learnerProgramEnrollments, membershipRoles,
  sectionEnrollments, sections, users,
} from "@/db/schema";
import { placementEligibilityDecisions } from "@/db/schema/placement-access";
import type { RequestContext } from "@/modules/identity/context";
import type { PlacementScopeDecision } from "./batch-eligibility-policy";
import { getTpoBatch } from "./tpo-batch-workspace-read-service";
import { summarizeBatchEligibility, batchEligibilityNextAction } from "./tpo-batch-eligibility-summary-model";

const MAX_BATCH_ASSESSMENTS = 500;
export async function getTpoBatchEligibilitySummary(context: RequestContext, batchId: string) {
  const { batch, collegeId, lifecycle } = await getTpoBatch(context, batchId);
  const db = getDb();
  const members = await db.select({
    id: learnerProgramEnrollments.id,
    membershipId: learnerProgramEnrollments.membershipId,
  }).from(learnerProgramEnrollments)
    .innerJoin(collegeMemberships, and(
      eq(collegeMemberships.id, learnerProgramEnrollments.membershipId),
      eq(collegeMemberships.collegeId, collegeId),
      eq(collegeMemberships.status, "ACTIVE"),
    ))
    .innerJoin(users, and(
      eq(users.id, collegeMemberships.userId),
      eq(users.platformStatus, "ACTIVE"),
    ))
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "LEARNER"),
    ))
    .where(and(
      eq(learnerProgramEnrollments.cohortId, batch.id),
      eq(learnerProgramEnrollments.status, "ACTIVE"),
    ))
    .orderBy(asc(learnerProgramEnrollments.id))
    .limit(MAX_BATCH_ASSESSMENTS + 1);
  const limited = members.length > MAX_BATCH_ASSESSMENTS;
  const assessed = members.slice(0, MAX_BATCH_ASSESSMENTS);
  const enrollmentIds = assessed.map(row => row.id);
  const activeSections = enrollmentIds.length
    ? await db.select({
        enrollmentId: sectionEnrollments.learnerEnrollmentId,
        sectionId: sections.id,
      }).from(sectionEnrollments)
      .innerJoin(sections, and(
        eq(sections.id, sectionEnrollments.sectionId),
        eq(sections.cohortId, batch.id),
        eq(sections.status, "ACTIVE"),
      ))
      .where(and(
        eq(sectionEnrollments.status, "ACTIVE"),
        inArray(sectionEnrollments.learnerEnrollmentId, enrollmentIds),
      ))
    : [];
  const scopes = [
    batch.id, ...assessed.map(row => row.membershipId),
    ...activeSections.map(row => row.sectionId),
  ];
  const stored = await db.select({
    scopeType: placementEligibilityDecisions.scopeType,
    scopeId: placementEligibilityDecisions.scopeId,
    status: placementEligibilityDecisions.status,
    reason: placementEligibilityDecisions.reason,
    note: placementEligibilityDecisions.note,
    decidedAt: placementEligibilityDecisions.decidedAt,
  }).from(placementEligibilityDecisions)
    .where(and(
      eq(placementEligibilityDecisions.collegeId, collegeId),
      inArray(placementEligibilityDecisions.scopeId, scopes),
    ));
  const learner = new Map<string, PlacementScopeDecision>();
  const section = new Map<string, PlacementScopeDecision>();
  let cohort: PlacementScopeDecision | null = null;
  for (const row of stored) {
    if (row.status !== "ELIGIBLE" && row.status !== "INELIGIBLE") continue;
    const decision: PlacementScopeDecision = {
      status: row.status, reason: row.reason, note: row.note, decidedAt: row.decidedAt,
    };
    if (row.scopeType === "MEMBERSHIP") learner.set(row.scopeId, decision);
    if (row.scopeType === "SECTION") section.set(row.scopeId, decision);
    if (row.scopeType === "COHORT" && row.scopeId === batch.id) cohort = decision;
  }
  const summary = summarizeBatchEligibility(
    assessed.map(row => ({
      membershipId: row.membershipId,
      sectionIds: activeSections.filter(s => s.enrollmentId === row.id).map(s => s.sectionId),
    })),
    { learner, section, cohort },
    limited,
  );
  return {
    batch, summary,
    nextAction: batchEligibilityNextAction(summary, Boolean(lifecycle?.finishedAt)),
    limit: MAX_BATCH_ASSESSMENTS,
  };
}
