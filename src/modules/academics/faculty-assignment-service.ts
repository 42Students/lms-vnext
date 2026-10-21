import {
  and,
  asc,
  eq,
  inArray,
  isNull,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { z } from "zod";
import {
  collegeMemberships,
  sectionFacultyAssignments,
  sections,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import {
  AcademicsServiceError,
  postgresConstraintName,
} from "./errors";
import {
  loadAcademicsMembership,
  loadFacultyAssignmentScope,
  requireAcademicRole,
} from "./a2-scope";
import { loadSectionScope } from "./scope";
import {
  createSectionFacultyAssignmentInputSchema,
  facultyAssignmentIdSchema,
  sectionIdSchema,
  type CreateSectionFacultyAssignmentInput,
} from "./validation";

function mapAssignmentConstraint(error: unknown) {
  if (
    postgresConstraintName(error) ===
    "section_faculty_assignments_active_uq"
  ) {
    return new AcademicsServiceError(
      "FACULTY_ASSIGNMENT_CONFLICT",
    );
  }

  return error;
}

export async function listSectionFacultyAssignments(
  context: RequestContext,
  sectionIdInput: string,
  includeEnded = false,
) {
  const sectionId =
    sectionIdSchema.parse(sectionIdInput);
  const section = await loadSectionScope(sectionId);

  requirePermission(context, "academics.read", {
    organizationId: section.organizationId,
    collegeId: section.collegeId,
  });

  const db = getDb();
  const conditions = [
    eq(
      sectionFacultyAssignments.sectionId,
      sectionId,
    ),
  ];

  if (!includeEnded) {
    conditions.push(
      isNull(sectionFacultyAssignments.endedAt),
    );
  }

  return db
    .select({
      id: sectionFacultyAssignments.id,
      sectionId:
        sectionFacultyAssignments.sectionId,
      membershipId:
        sectionFacultyAssignments.membershipId,
      displayName: users.displayName,
      role: sectionFacultyAssignments.role,
      startedAt:
        sectionFacultyAssignments.startedAt,
      endedAt: sectionFacultyAssignments.endedAt,
    })
    .from(sectionFacultyAssignments)
    .innerJoin(
      collegeMemberships,
      eq(
        collegeMemberships.id,
        sectionFacultyAssignments.membershipId,
      ),
    )
    .innerJoin(
      users,
      eq(users.id, collegeMemberships.userId),
    )
    .where(and(...conditions))
    .orderBy(
      asc(sectionFacultyAssignments.role),
      asc(users.displayName),
    );
}

export async function createSectionFacultyAssignment(
  context: RequestContext,
  rawInput: CreateSectionFacultyAssignmentInput,
) {
  const input =
    createSectionFacultyAssignmentInputSchema.parse(
      rawInput,
    );
  const [section, membership] =
    await Promise.all([
      loadSectionScope(input.sectionId),
      loadAcademicsMembership(
        input.membershipId,
      ),
    ]);

  requirePermission(context, "academics.manage", {
    organizationId: section.organizationId,
    collegeId: section.collegeId,
  });

  requireAcademicRole(membership, "FACULTY");

  if (
    membership.collegeId !== section.collegeId
  ) {
    throw new AcademicsServiceError(
      "MEMBERSHIP_COLLEGE_MISMATCH",
    );
  }

  if (section.status !== "ACTIVE") {
    throw new AcademicsServiceError(
      "SECTION_NOT_FOUND",
    );
  }

  const db = getDb();

  try {
    const [created] = await db
      .insert(sectionFacultyAssignments)
      .values(input)
      .returning();

    return created;
  } catch (error) {
    throw mapAssignmentConstraint(error);
  }
}

export async function endSectionFacultyAssignment(
  context: RequestContext,
  assignmentIdInput: string,
) {
  const assignmentId =
    facultyAssignmentIdSchema.parse(
      assignmentIdInput,
    );
  const current =
    await loadFacultyAssignmentScope(
      assignmentId,
    );

  requirePermission(context, "academics.manage", {
    organizationId: current.organizationId,
    collegeId: current.collegeId,
  });

  if (current.endedAt) {
    throw new AcademicsServiceError(
      "FACULTY_ASSIGNMENT_NOT_FOUND",
    );
  }

  const db = getDb();
  const now = new Date();

  const [updated] = await db
    .update(sectionFacultyAssignments)
    .set({
      endedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(
          sectionFacultyAssignments.id,
          assignmentId,
        ),
        isNull(sectionFacultyAssignments.endedAt),
      ),
    )
    .returning();

  if (!updated) {
    throw new AcademicsServiceError(
      "FACULTY_ASSIGNMENT_NOT_FOUND",
    );
  }

  return updated;
}


/**
 * Legacy bulk faculty mapping is atomic: no write happens until every section
 * and every faculty membership has passed the same college and role checks.
 * A section ADVISOR/COORDINATOR assignment never grants course-delivery access;
 * course and elective permissions must be checked against explicit teaching
 * grants, not inferred from this roster.
 */
export async function bulkCreateSectionFacultyAssignments(
  context: RequestContext,
  rawInput: unknown,
) {
  const input = z.array(createSectionFacultyAssignmentInputSchema)
    .min(1).max(200).parse(rawInput);
  const keys = new Set<string>();
  for (const candidate of input) {
    const key = `${candidate.sectionId}:${candidate.membershipId}:${candidate.role}`;
    if (keys.has(key)) {
      throw new AcademicsServiceError("FACULTY_ASSIGNMENT_CONFLICT");
    }
    keys.add(key);
  }

  // Prevalidate the entire operation before opening a write transaction.
  const checked = await Promise.all(input.map(async candidate => {
    const [section, member] = await Promise.all([
      loadSectionScope(candidate.sectionId),
      loadAcademicsMembership(candidate.membershipId),
    ]);
    requirePermission(context, "academics.manage", {
      organizationId: section.organizationId,
      collegeId: section.collegeId,
    });
    requireAcademicRole(member, "FACULTY");
    if (section.status !== "ACTIVE")
      throw new AcademicsServiceError("SECTION_NOT_FOUND");
    if (member.collegeId !== section.collegeId)
      throw new AcademicsServiceError("MEMBERSHIP_COLLEGE_MISMATCH");
    return section.collegeId;
  }));
  if (new Set(checked).size !== 1)
    throw new AcademicsServiceError("MEMBERSHIP_COLLEGE_MISMATCH");

  try {
    return await getDb().transaction(async tx =>
      tx.insert(sectionFacultyAssignments).values(input).returning()
    );
  } catch (error) {
    throw mapAssignmentConstraint(error);
  }
}

/**
 * Reversible term-scoped faculty assignment lifecycle for batch promotion.
 * Only this transition's deactivated rows can be reactivated; manually ended
 * or legacy-deleted assignments are not silently restored.
 */
export async function transitionCohortFacultyAssignmentTerm(
  context: RequestContext,
  rawInput: unknown,
) {
  const input = z.object({
    cohortId: z.string().uuid(),
    academicPeriodId: z.string().uuid(),
    action: z.enum(["DEACTIVATE", "REACTIVATE"]),
  }).strict().parse(rawInput);
  const [section] = await getDb().select({ id: sections.id })
    .from(sections)
    .where(and(eq(sections.cohortId, input.cohortId),
      eq(sections.academicPeriodId, input.academicPeriodId)))
    .limit(1);
  if (!section) throw new AcademicsServiceError("SECTION_NOT_FOUND");
  const scope = await loadSectionScope(section.id);
  requirePermission(context, "academics.manage", {
    organizationId: scope.organizationId,
    collegeId: scope.collegeId,
  });

  try {
    return await getDb().transaction(async tx => {
      const assignments = await tx.select({
        id: sectionFacultyAssignments.id,
        endedAt: sectionFacultyAssignments.endedAt,
        legacyDeactivatedAt: sectionFacultyAssignments.legacyDeactivatedAt,
        legacyWasDeleted: sectionFacultyAssignments.legacyWasDeleted,
      }).from(sectionFacultyAssignments)
        .innerJoin(sections, eq(sections.id, sectionFacultyAssignments.sectionId))
        .where(and(eq(sections.cohortId, input.cohortId),
          eq(sections.academicPeriodId, input.academicPeriodId)))
        .for("update");
      const affected = assignments.filter(row => input.action === "DEACTIVATE"
        ? row.endedAt === null
        : row.endedAt !== null && row.legacyDeactivatedAt !== null &&
          row.legacyWasDeleted !== true);
      if (affected.length === 0) return { changed: 0 };
      const now = new Date();
      await tx.update(sectionFacultyAssignments).set(input.action === "DEACTIVATE"
        ? { endedAt: now, legacyDeactivatedAt: now, updatedAt: now }
        : { endedAt: null, legacyDeactivatedAt: null, updatedAt: now })
        .where(inArray(sectionFacultyAssignments.id, affected.map(row => row.id)));
      return { changed: affected.length };
    });
  } catch (error) {
    throw mapAssignmentConstraint(error);
  }
}
