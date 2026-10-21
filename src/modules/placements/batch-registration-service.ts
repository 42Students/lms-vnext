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
  users,
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

/** Accept legacy JSON consent and modern acceptedConsent, preserving strict
 * validation after mapping. URL-encoded legacy posts normalize at the route. */
const selfRegistrationInput = z.preprocess(value=>{
 if(!value||typeof value!=="object"||Array.isArray(value))return value;
 const fields=value as Record<string,unknown>;
 if("acceptedConsent" in fields||!("consent" in fields))return value;
 const {consent,...rest}=fields;
 return {...rest,acceptedConsent:consent===true||consent==="true"||
  consent==="on"||consent==="1"};
},z.object({
  choice: z.enum(["PLACEMENTS", "HIGHER_STUDIES", "NOT_INTERESTED"], {
    error: issue => issue.input === undefined || issue.input === null || issue.input === ""
      ? "Choose Placements, Higher studies or Not interested"
      : "Unknown registration choice",
  }),
  acceptedConsent: z.boolean(),
}).strict());

export class PlacementRegistrationError extends Error {
  constructor(public readonly code:
    | "DB08_REGISTRATION_FORBIDDEN"
    | "DB08_REGISTRATION_MODULE_DISABLED"
    | "DB08_REGISTRATION_ENROLLMENT_INVALID"
    | "DB08_REGISTRATION_NOT_ELIGIBLE"
    | "DB08_REGISTRATION_WINDOW_CLOSED",
    public readonly alreadyRegistered = false) {
    super(code);
    this.name = "PlacementRegistrationError";
  }

  /** Safe user-facing copy; the stable code is retained for API consumers. */
  get userMessage(): string {
    switch (this.code) {
      case "DB08_REGISTRATION_FORBIDDEN": return "You cannot register for placements with this account.";
      case "DB08_REGISTRATION_MODULE_DISABLED": return "Placements is not enabled for your college.";
      case "DB08_REGISTRATION_ENROLLMENT_INVALID": return "Ask your college to check your batch.";
      case "DB08_REGISTRATION_NOT_ELIGIBLE": return "Ask the placement cell about your eligibility.";
      case "DB08_REGISTRATION_WINDOW_CLOSED": return this.alreadyRegistered
        ? "Registration is closed. Ask the placement cell to change your choice."
        : "Registration is closed. Ask the placement cell to register you.";
    }
  }
}

/**
 * An authenticated learner registers for their current academic cohort.
 *
 * The college row lock serializes with DB08 eligibility decisions/undo and
 * batch setting/finish operations. No caller-supplied learner or college ID is
 * trusted. The registration and its append-only event are one DB transaction.
 *
 * HTTP registration uses the central learner placement gate before this write;
 * the persisted account, program enrollment, eligibility and college deadline
 * are rechecked under the college lock. A module disable transaction must
 * coordinate with the same lock before global phase acceptance.
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
      platformStatus: users.platformStatus,
    }).from(collegeMemberships)
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .innerJoin(membershipRoles, and(
        eq(membershipRoles.membershipId, collegeMemberships.id),
        eq(membershipRoles.role, "LEARNER"),
      ))
      .where(eq(collegeMemberships.id, membership.id))
      // Keep account/role/membership live through the registration INSERT.
      .for("share")
      .limit(1);
    if (!learner || learner.status !== "ACTIVE" ||
        learner.platformStatus !== "ACTIVE" ||
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
    const [existing] = await tx.select().from(placementBatchRegistrations)
      .where(and(
        eq(placementBatchRegistrations.membershipId, membership.id),
        eq(placementBatchRegistrations.cohortId, enrollment.cohortId),
      )).limit(1);
    if (!window.open) {
      throw new PlacementRegistrationError("DB08_REGISTRATION_WINDOW_CLOSED", Boolean(existing));
    }

    const payload = createRegistrationWrite({ ...input, now });

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
    // Legacy per-season registration maps to the current enrolled cohort
    // and immutable consentAt; SELF records the actor. Invite notices belong
    // to TPO batch-window opening, never the learner self-registration.
    // SQL AFTER INSERT/UPDATE trigger generates one immutable event, including
    // for a future writer that bypasses this application service.
    return registration;
  });
}
