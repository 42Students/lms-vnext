import "server-only";

import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  cohorts, collegeMemberships, departments, learnerProgramEnrollments,
  lmsGroupMembers, lmsGroupRules, lmsGroups, membershipRoles,
  placementCandidateAcademicEvidence, programs, users,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { groupRuleCriteriaSchema } from "./rule-evaluator";
import {
  collegeRulePreviewInputSchema,
  GROUP_RULE_PREVIEW_MAX_CANDIDATES,
  projectCollegeGroupRulePreview,
} from "./college-rule-preview-model";

type Reader = Pick<ReturnType<typeof getDb>, "select">;

/** Old GET without a configured rule returned no content (204).
 * The vNext page renders this explicit state for screen readers instead of
 * presenting a generic failure. No eligibility query is executed.
 */
export const COLLEGE_RULE_NOT_CONFIGURED_STATE={
 title:"No rule configured",
 message:"This group has no automatic membership rule. Preview only; no learners were evaluated or changed.",
} as const;

export class CollegeRulePreviewError extends Error {
  constructor(public readonly code:
    "GROUP_NOT_FOUND" | "RULE_NOT_CONFIGURED" | "RULE_CRITERIA_UNSUPPORTED" |
    "RULE_CRITERIA_FOREIGN_SCOPE" | "RULE_KIND_UNSUPPORTED") {
    super(code); this.name = "CollegeRulePreviewError";
  }
}

export async function previewCollegeGroupRule(
  context: RequestContext,
  raw: unknown,
  reader: Reader = getDb(),
) {
  const { groupId } = collegeRulePreviewInputSchema.parse(raw);
  const member = context.membership;
  if (!member || !hasMembershipRole(context, "COLLEGE_ADMIN") ||
      !can(context, "academics.manage", {
        organizationId: member.organizationId,
        collegeId: member.collegeId,
      })) throw new AuthorizationError("academics.manage");
  requirePermission(context, "academics.manage", {
    organizationId: member.organizationId,
    collegeId: member.collegeId,
  });
  const [group] = await reader.select({
    id: lmsGroups.id,
    name: lmsGroups.name,
    kind: lmsGroups.kind,
    status: lmsGroups.status,
    capacity: lmsGroups.capacity,
    collegeId: lmsGroups.collegeId,
  }).from(lmsGroups).where(and(
    eq(lmsGroups.id, groupId),
    eq(lmsGroups.collegeId, member.collegeId),
    eq(lmsGroups.ownerScope, "COLLEGE"),
    isNull(lmsGroups.deletedAt),
  )).limit(1);
  if (!group) throw new CollegeRulePreviewError("GROUP_NOT_FOUND");
  if (group.kind === "ELECTIVE" || group.kind === "PROJECT_TEAM")
    throw new CollegeRulePreviewError("RULE_KIND_UNSUPPORTED");

  const [rule] = await reader.select().from(lmsGroupRules)
    .where(eq(lmsGroupRules.groupId, group.id)).limit(1);
  if (!rule) throw new CollegeRulePreviewError("RULE_NOT_CONFIGURED");
  if (rule.criteriaVersion !== 1)
    throw new CollegeRulePreviewError("RULE_CRITERIA_UNSUPPORTED");
  const parsed = groupRuleCriteriaSchema.safeParse(rule.criteriaJson);
  if (!parsed.success) throw new CollegeRulePreviewError("RULE_CRITERIA_UNSUPPORTED");
  const criteria = parsed.data;

  if (criteria.allowedProgramIds.length > 0) {
    const matches = await reader.select({ id: programs.id }).from(programs)
      .innerJoin(departments, eq(departments.id, programs.departmentId))
      .where(and(inArray(programs.id, criteria.allowedProgramIds),
        eq(departments.collegeId, member.collegeId)));
    if (matches.length !== new Set(criteria.allowedProgramIds).size)
      throw new CollegeRulePreviewError("RULE_CRITERIA_FOREIGN_SCOPE");
  }
  if (criteria.allowedCohortIds.length > 0) {
    const matches = await reader.select({ id: cohorts.id }).from(cohorts)
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(departments, eq(departments.id, programs.departmentId))
      .where(and(inArray(cohorts.id, criteria.allowedCohortIds),
        eq(departments.collegeId, member.collegeId)));
    if (matches.length !== new Set(criteria.allowedCohortIds).size)
      throw new CollegeRulePreviewError("RULE_CRITERIA_FOREIGN_SCOPE");
  }

  const candidates = await reader.select({
    membershipId: collegeMemberships.id,
    programId: learnerProgramEnrollments.programId,
    cohortId: learnerProgramEnrollments.cohortId,
    cgpaHundredths: placementCandidateAcademicEvidence.cgpaHundredths,
    activeBacklogs: placementCandidateAcademicEvidence.activeBacklogs,
    passingYear: placementCandidateAcademicEvidence.passingYear,
  }).from(learnerProgramEnrollments)
    .innerJoin(collegeMemberships, and(
      eq(collegeMemberships.id, learnerProgramEnrollments.membershipId),
      eq(collegeMemberships.collegeId, member.collegeId),
      eq(collegeMemberships.status, "ACTIVE"),
    ))
    .innerJoin(users, and(
      eq(users.id, collegeMemberships.userId),
      eq(users.platformStatus, "ACTIVE"),
    ))
    .innerJoin(programs, eq(programs.id, learnerProgramEnrollments.programId))
    .innerJoin(departments, and(
      eq(departments.id, programs.departmentId),
      eq(departments.collegeId, member.collegeId),
    ))
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "LEARNER"),
    ))
    .leftJoin(placementCandidateAcademicEvidence,
      eq(placementCandidateAcademicEvidence.membershipId, collegeMemberships.id))
    .where(eq(learnerProgramEnrollments.status, "ACTIVE"))
    .orderBy(asc(collegeMemberships.id))
    .limit(GROUP_RULE_PREVIEW_MAX_CANDIDATES + 1);

  const incomplete = candidates.length > GROUP_RULE_PREVIEW_MAX_CANDIDATES;
  const examined = candidates.slice(0, GROUP_RULE_PREVIEW_MAX_CANDIDATES);
  const current = await reader.select({
    membershipId: lmsGroupMembers.membershipId,
  }).from(lmsGroupMembers).where(and(
    eq(lmsGroupMembers.groupId, group.id),
    eq(lmsGroupMembers.state, "ACTIVE"),
  ));
  return {
    group: { id: group.id, name: group.name, status: group.status, capacity: group.capacity },
    criteria,
    autoRefresh: rule.autoRefresh,
    lastRunAt: rule.lastRunAt,
    lastRunMatched: rule.lastRunMatched,
    projection: projectCollegeGroupRulePreview(
      criteria, examined, new Set(current.map(row => row.membershipId)), incomplete,
    ),
  };
}
