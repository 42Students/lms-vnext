import {
  and,
  asc,
  eq,
  inArray,
  isNull,
  count,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { z } from "zod";
import {
  collegeMemberships,
  sectionFacultyAssignments,
  sections,
  users,
  courses,
  courseOfferings,
  courseSectionDeliveries,
  courseTeachingAssignments,
  departments,
  cohorts,
  programs,
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
      sectionName: sections.name,
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
    .innerJoin(sections,eq(sections.id,sectionFacultyAssignments.sectionId))
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
      asc(sectionFacultyAssignments.id),
    );
}


/** Course teaching grants are separate from advisory/class rosters.
 * This is the compatibility faculty/class/course mapping directory: section
 * faculty assignments never grant access to course content by implication.
 */
export async function listFacultyCourseAssociations(
  context:RequestContext,raw:{
    facultyMembershipId?:string;courseId?:string;includeEnded?:boolean;
    limit?:number;offset?:number;
  }={},
) {
  const input=z.strictObject({
    facultyMembershipId:z.uuid().optional(),
    courseId:z.uuid().optional(),
    includeEnded:z.boolean().default(false),
    limit:z.number().int().min(1).max(200).default(50),
    offset:z.number().int().min(0).max(100000).default(0),
  }).parse(raw);
  const acting=await import("@/modules/permissions/acting-college").then(
    module=>module.resolveActingCollege(context,"academics.read"));
  if(input.facultyMembershipId){
    const faculty=await loadAcademicsMembership(input.facultyMembershipId);
    requireAcademicRole(faculty,"FACULTY");
    if(faculty.collegeId!==acting.collegeId)
      throw new AcademicsServiceError("MEMBERSHIP_COLLEGE_MISMATCH");
  }
  const scope=and(
    eq(departments.collegeId,acting.collegeId),
    eq(collegeMemberships.collegeId,acting.collegeId),
    input.facultyMembershipId?eq(courseTeachingAssignments.membershipId,input.facultyMembershipId):undefined,
    input.courseId?eq(courses.id,input.courseId):undefined,
    input.includeEnded?undefined:isNull(courseTeachingAssignments.endedAt),
  );
  const db=getDb();
  const directory=()=>db.select({
    mappingId:courseTeachingAssignments.id,
    membershipId:courseTeachingAssignments.membershipId,
    deliveryId:courseSectionDeliveries.id,
    classId:sections.id,sectionName:sections.name,
    className:sections.name,
    courseId:courses.id,courseName:courses.name,
    courseSlug:courses.slug,
    programId:programs.id,programName:programs.name,
    batchId:cohorts.id,batchName:cohorts.name,
    role:courseTeachingAssignments.role,
    startedAt:courseTeachingAssignments.startedAt,
    endedAt:courseTeachingAssignments.endedAt,
    active:sql<boolean>`${courseTeachingAssignments.endedAt} is null`,
  }).from(courseTeachingAssignments)
    .innerJoin(collegeMemberships,eq(collegeMemberships.id,courseTeachingAssignments.membershipId))
    .innerJoin(courseSectionDeliveries,eq(courseSectionDeliveries.id,courseTeachingAssignments.deliveryId))
    .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
    .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
    .innerJoin(departments,eq(departments.id,courses.departmentId))
    .innerJoin(sections,and(eq(sections.id,courseSectionDeliveries.sectionId),
      eq(sections.cohortId,courseOfferings.cohortId),
      eq(sections.academicPeriodId,courseOfferings.academicPeriodId)))
    .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
    .innerJoin(programs,eq(programs.id,cohorts.programId));
  const rows=await directory().where(scope)
    .orderBy(asc(programs.name),asc(courses.name),asc(sections.name),
      asc(courseTeachingAssignments.id))
    .limit(input.limit).offset(input.offset);
  // Full-list aggregates must not be calculated from one paginated slice.
  const [totals]=await db.select({
    mappings:count(),
    distinctCourses:sql<number>`count(distinct ${courses.id})::int`,
    distinctClasses:sql<number>`count(distinct ${sections.id})::int`,
    distinctFaculty:sql<number>`count(distinct ${courseTeachingAssignments.membershipId})::int`,
  }).from(courseTeachingAssignments)
    .innerJoin(collegeMemberships,eq(collegeMemberships.id,courseTeachingAssignments.membershipId))
    .innerJoin(courseSectionDeliveries,eq(courseSectionDeliveries.id,courseTeachingAssignments.deliveryId))
    .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
    .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
    .innerJoin(departments,eq(departments.id,courses.departmentId))
    .innerJoin(sections,and(eq(sections.id,courseSectionDeliveries.sectionId),
      eq(sections.cohortId,courseOfferings.cohortId),
      eq(sections.academicPeriodId,courseOfferings.academicPeriodId)))
    .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
    .innerJoin(programs,eq(programs.id,cohorts.programId))
    .where(scope);
  return {rows,summary:{
    mappingCount:totals?.mappings??0,
    courseCount:totals?.distinctCourses??0,
    classCount:totals?.distinctClasses??0,
    facultyCount:totals?.distinctFaculty??0,
  },pageSize:input.limit,offset:input.offset,
    // Display headings for migrated DTO consumer parity.
    columnLabels:{courseSlug:"Course",sectionName:"Section",mappingId:"Mapping ID"},
  };
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
    return await db.transaction(async tx=>{
      // Lock the parent section to serialize role restores and initial inserts.
      await tx.select({id:sections.id}).from(sections)
        .where(eq(sections.id,input.sectionId)).for("update");
      const history=await tx.select().from(sectionFacultyAssignments)
        .where(and(eq(sectionFacultyAssignments.sectionId,input.sectionId),
          eq(sectionFacultyAssignments.membershipId,input.membershipId),
          eq(sectionFacultyAssignments.role,input.role)))
        .orderBy(asc(sectionFacultyAssignments.startedAt))
        .for("update");
      if(history.some(item=>item.endedAt===null))
        throw new AcademicsServiceError("FACULTY_ASSIGNMENT_CONFLICT");
      const previous=[...history].reverse().find(item=>item.endedAt!==null &&
        item.legacyWasDeleted!==true);
      const [created]=previous?
        await tx.update(sectionFacultyAssignments).set({
          endedAt:null,legacyDeactivatedAt:null,startedAt:new Date(),updatedAt:new Date(),
        }).where(and(eq(sectionFacultyAssignments.id,previous.id),
          eq(sectionFacultyAssignments.sectionId,input.sectionId)))
          .returning():
        await tx.insert(sectionFacultyAssignments).values(input).returning();
      if(!created)throw new AcademicsServiceError("FACULTY_ASSIGNMENT_NOT_FOUND");
      return created;
    });
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
