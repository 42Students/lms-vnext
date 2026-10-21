import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  cohorts, collegeMemberships, departments, learnerProgramEnrollments,
  membershipRoles, programs, sectionEnrollments, sections, users,
} from "@/db/schema";
import { placementEligibilityDecisions } from "@/db/schema/placement-access";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import type { PlacementScopeDecision } from "./batch-eligibility-policy";
import { summarizeBatchEligibility } from "./tpo-batch-eligibility-summary-model";
import { requireTpoBatchActor } from "./tpo-batch-workspace-read-service";

/**
 * Complete, not sampled, current-page batch eligibility. Database reads are
 * chunked to avoid PostgreSQL parameter limits on large college rosters.
 * Cross-tenant batch IDs are rejected before any member decision is queried.
 */
export async function listTpoBatchCardEligibility(
  context: RequestContext,
  batchIds: readonly string[],
) {
  const collegeId = await requireTpoBatchActor(context);
  const output = new Map<string, ReturnType<typeof summarizeBatchEligibility>>();
  if (!batchIds.length) return output;
  const ids = [...new Set(batchIds)];

  const db = getDb();
  const allowed = await db.select({ id: cohorts.id }).from(cohorts)
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, and(
      eq(departments.id, programs.departmentId),
      eq(departments.collegeId, collegeId),
    ))
    .where(inArray(cohorts.id, ids));
  if (allowed.length !== ids.length) throw new AuthorizationError("placements.manage");

  const learners = await db.select({
    id: learnerProgramEnrollments.id,
    membershipId: learnerProgramEnrollments.membershipId,
    cohortId: learnerProgramEnrollments.cohortId,
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
      inArray(learnerProgramEnrollments.cohortId, ids),
      eq(learnerProgramEnrollments.status, "ACTIVE"),
    ));

  const sectionsByEnrollment = new Map<string, Set<string>>();
  const enrollmentIds = learners.map(row => row.id);
  for (let from = 0; from < enrollmentIds.length; from += 1000) {
    const records = await db.select({
      enrollmentId: sectionEnrollments.learnerEnrollmentId,
      sectionId: sections.id,
    }).from(sectionEnrollments)
      .innerJoin(learnerProgramEnrollments,
        eq(learnerProgramEnrollments.id, sectionEnrollments.learnerEnrollmentId))
      .innerJoin(sections, and(
        eq(sections.id, sectionEnrollments.sectionId),
        eq(sections.cohortId, learnerProgramEnrollments.cohortId),
        eq(sections.status, "ACTIVE"),
        inArray(sections.cohortId, ids),
      ))
      .where(and(
        eq(sectionEnrollments.status, "ACTIVE"),
        inArray(sectionEnrollments.learnerEnrollmentId, enrollmentIds.slice(from, from + 1000)),
      ));
    for (const row of records) {
      const set = sectionsByEnrollment.get(row.enrollmentId) ?? new Set<string>();
      set.add(row.sectionId);
      sectionsByEnrollment.set(row.enrollmentId, set);
    }
  }

  const scopeIds = [...new Set([
    ...ids, ...learners.map(row => row.membershipId),
    ...[...sectionsByEnrollment.values()].flatMap(set => [...set]),
  ])];
  const decisions = new Map<string, PlacementScopeDecision>();
  for (let from = 0; from < scopeIds.length; from += 1000) {
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
        inArray(placementEligibilityDecisions.scopeId, scopeIds.slice(from, from + 1000)),
      ));
    for (const row of stored) {
      if (row.status !== "ELIGIBLE" && row.status !== "INELIGIBLE") continue;
      decisions.set(row.scopeType + ":" + row.scopeId, {
        status: row.status,
        reason: row.reason,
        note: row.note,
        decidedAt: row.decidedAt,
      });
    }
  }

  const byBatch = new Map<string, Map<string, Set<string>>>();
  for (const row of learners) {
    const members = byBatch.get(row.cohortId) ?? new Map<string, Set<string>>();
    const sectionIds = members.get(row.membershipId) ?? new Set<string>();
    for (const id of sectionsByEnrollment.get(row.id) ?? []) sectionIds.add(id);
    members.set(row.membershipId, sectionIds);
    byBatch.set(row.cohortId, members);
  }
  for (const batchId of ids) {
    const members = byBatch.get(batchId) ?? new Map<string, Set<string>>();
    const learner = new Map<string, PlacementScopeDecision>();
    const section = new Map<string, PlacementScopeDecision>();
    for (const membershipId of members.keys()) {
      const value = decisions.get("MEMBERSHIP:" + membershipId);
      if (value) learner.set(membershipId, value);
    }
    for (const set of members.values()) {
      for (const sectionId of set) {
        const value = decisions.get("SECTION:" + sectionId);
        if (value) section.set(sectionId, value);
      }
    }
    output.set(batchId, summarizeBatchEligibility(
      [...members].map(([membershipId, sectionIds]) => ({
        membershipId,
        // A verified direct learner decision wins over conflicting section
        // enrollment history. Only section-derived decisions are ambiguous
        // when more than one active class remains.
        sectionIds:learner.has(membershipId)?[]:[...sectionIds],
      })),
      { learner, section, cohort: decisions.get("COHORT:" + batchId) ?? null },
      false,
    ));
  }
  return output;
}
