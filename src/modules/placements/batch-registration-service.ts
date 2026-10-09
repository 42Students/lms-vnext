import { and, eq, or } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  cohorts,
  collegeMemberships,
  colleges,
  departments,
  learnerProgramEnrollments,
  membershipRoles,
  programs,
  sectionEnrollments,
  sections,
} from "@/db/schema";
import { placementEligibilityDecisions } from "@/db/schema/placement-access";
import { placementBatchLifecycles } from "@/db/schema/placement-batches";
import { placementBatchRegistrations } from "@/db/schema/placement-registration";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import {
  createRegistrationWrite,
  resolveRegistrationWindow,
} from "./batch-registration-policy";
import { resolvePlacementParticipation } from "./batch-eligibility-policy";

const selfRegistrationInput = z.object({
  choice: z.enum(["PLACEMENTS", "HIGHER_STUDIES", "NOT_INTERESTED"]),
  acceptedConsent: z.boolean(),
}).strict();

export class PlacementRegistrationError extends Error {
  constructor(public readonly code:
    | "DB08_REGISTRATION_FORBIDDEN"
    | "DB08_REGISTRATION_MODULE_DISABLED"
    | "DB08_REGISTRATION_ENROLLMENT_INVALID"
    | "DB08_REGISTRATION_NOT_ELIGIBLE"
    | "DB08_REGISTRATION_WINDOW_CLOSED") {
    super(code);
    this.name = "PlacementRegistrationError";
  }
}

/**
 * An authenticated learner registers for their current academic cohort.
 *
 * The college row lock serializes with DB08 eligibility decisions/undo and
 * batch setting/finish operations. No caller-supplied learner or college ID is
 * trusted. The registration and its append-only event are one DB transaction.
 *
 * This is NOT yet wired to HTTP: paid-module disable races must be revisited
 * when module writes adopt the same college lock protocol.
 */
export async function registerOwnPlacementChoice(
  context: RequestContext,
  raw: unknown,
) {
  const input = selfRegistrationInput.parse(raw);
  if (!hasMembershipRole(context, "LEARNER") ||
      !context.membership || context.user.platformStatus !== "ACTIVE") {
    throw new PlacementRegistrationError("DB08_REGISTRATION_FORBIDDEN");
  }

  const modules = await resolveOptionalModuleAccess(context);
  if (!modules.placements.enabled) {
    throw new PlacementRegistrationError("DB08_REGISTRATION_MODULE_DISABLED");
  }

  const membership = context.membership;
  const db = getDb();
  return db.transaction(async (tx) => {
    const [college] = await tx.select({ id: colleges.id })
      .from(colleges)
      .where(eq(colleges.id, membership.collegeId))
      .for("update")
      .limit(1);
    if (!college) throw new PlacementRegistrationError("DB08_REGISTRATION_FORBIDDEN");

    const [learner] = await tx.select({
      id: collegeMemberships.id,
      status: collegeMemberships.status,
      collegeId: collegeMemberships.collegeId,
      userId: collegeMemberships.userId,
    }).from(collegeMemberships)
      .innerJoin(membershipRoles, and(
        eq(membershipRoles.membershipId, collegeMemberships.id),
        eq(membershipRoles.role, "LEARNER"),
      ))
      .where(eq(collegeMemberships.id, membership.id))
      .limit(1);
    if (!learner || learner.status !== "ACTIVE" ||
        learner.collegeId !== membership.collegeId ||
        learner.userId !== context.user.id) {
      throw new PlacementRegistrationError("DB08_REGISTRATION_FORBIDDEN");
    }

    const enrollments = await tx.select({
      id: learnerProgramEnrollments.id,
      cohortId: learnerProgramEnrollments.cohortId,
      collegeId: departments.collegeId,
    }).from(learnerProgramEnrollments)
      .innerJoin(cohorts, and(
        eq(cohorts.id, learnerProgramEnrollments.cohortId),
        eq(cohorts.programId, learnerProgramEnrollments.programId),
      ))
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(departments, eq(departments.id, programs.departmentId))
      .where(and(
        eq(learnerProgramEnrollments.membershipId, learner.id),
        eq(learnerProgramEnrollments.status, "ACTIVE"),
      )).limit(2);
    if (enrollments.length !== 1 ||
        enrollments[0].collegeId !== membership.collegeId) {
      throw new PlacementRegistrationError("DB08_REGISTRATION_ENROLLMENT_INVALID");
    }
    const enrollment = enrollments[0];

    const activeSections = await tx.select({
      id: sections.id,
      cohortId: sections.cohortId,
    }).from(sectionEnrollments)
      .innerJoin(sections, and(
        eq(sections.id, sectionEnrollments.sectionId),
        eq(sections.academicPeriodId, sectionEnrollments.academicPeriodId),
      ))
      .where(and(
        eq(sectionEnrollments.learnerEnrollmentId, enrollment.id),
        eq(sectionEnrollments.status, "ACTIVE"),
      )).limit(2);
    if (activeSections.length > 1 || (
      activeSections[0] && activeSections[0].cohortId !== enrollment.cohortId
    )) {
      throw new PlacementRegistrationError("DB08_REGISTRATION_ENROLLMENT_INVALID");
    }
    const sectionId = activeSections[0]?.id ?? null;
    const scopes = [
      { type: "MEMBERSHIP", id: membership.id },
      { type: "COHORT", id: enrollment.cohortId },
      ...(sectionId ? [{ type: "SECTION", id: sectionId }] : []),
    ];
    const decisions = await tx.select().from(placementEligibilityDecisions)
      .where(and(
        eq(placementEligibilityDecisions.collegeId, membership.collegeId),
        or(...scopes.map((s) => and(
          eq(placementEligibilityDecisions.scopeType, s.type),
          eq(placementEligibilityDecisions.scopeId, s.id),
        ))),
      ));
    const find = (type: string, id: string | null) => {
      const row = decisions.find(d => d.scopeType === type && d.scopeId === id);
      return row ? {
        status: row.status as "ELIGIBLE" | "INELIGIBLE",
        reason: row.reason,
        note: row.note,
        decidedAt: row.decidedAt,
      } : null;
    };
    const participation = resolvePlacementParticipation({
      learner: find("MEMBERSHIP", membership.id),
      section: find("SECTION", sectionId),
      cohort: find("COHORT", enrollment.cohortId),
    });
    if (participation.status !== "ELIGIBLE") {
      throw new PlacementRegistrationError("DB08_REGISTRATION_NOT_ELIGIBLE");
    }

    const [batch] = await tx.select().from(placementBatchLifecycles)
      .where(and(
        eq(placementBatchLifecycles.cohortId, enrollment.cohortId),
        eq(placementBatchLifecycles.collegeId, membership.collegeId),
      )).limit(1);
    const now = new Date();
    const window = resolveRegistrationWindow(batch ? {
      invitedAt: batch.invitedAt,
      finishedAt: batch.finishedAt,
      deadline: batch.registrationDeadline,
    } : null, now);
    if (!window.open) {
      throw new PlacementRegistrationError("DB08_REGISTRATION_WINDOW_CLOSED");
    }

    const payload = createRegistrationWrite({ ...input, now });
    const [existing] = await tx.select().from(placementBatchRegistrations)
      .where(and(
        eq(placementBatchRegistrations.membershipId, membership.id),
        eq(placementBatchRegistrations.cohortId, enrollment.cohortId),
      )).limit(1);

    // Duplicate submission must not manufacture a second consent timestamp.
    if (existing && existing.choice === payload.choice &&
        existing.consentVersion === payload.consentVersion) {
      return existing;
    }

    let registration: typeof placementBatchRegistrations.$inferSelect | undefined;
    if (!existing) {
      [registration] = await tx.insert(placementBatchRegistrations).values({
        collegeId: membership.collegeId,
        cohortId: enrollment.cohortId,
        membershipId: membership.id,
        choice: payload.choice,
        consentVersion: payload.consentVersion,
        consentAt: payload.consentAt,
        source: "SELF",
        recordedByUserId: context.user.id,
      }).returning();
    } else {
      [registration] = await tx.update(placementBatchRegistrations).set({
        choice: payload.choice,
        consentVersion: payload.consentVersion,
        consentAt: payload.consentAt,
        source: "SELF",
        recordedByUserId: context.user.id,
        version: existing.version + 1,
        updatedAt: now,
      }).where(eq(placementBatchRegistrations.id, existing.id)).returning();
    }
    if (!registration) throw new Error("DB08 registration persistence failed");
    // SQL AFTER INSERT/UPDATE trigger generates one immutable event, including
    // for a future writer that bypasses this application service.
    return registration;
  });
}
