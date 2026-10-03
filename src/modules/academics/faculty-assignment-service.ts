import {
  and,
  asc,
  eq,
  isNull,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  sectionFacultyAssignments,
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
