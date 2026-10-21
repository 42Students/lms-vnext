import {
  and,
  asc,
  eq,
  isNull,
  or,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  membershipRoles,
  courseSectionDeliveries,
  courseTeachingAssignments,
  courseOfferings,
  courses,
  departments,
  colleges,
  organizations,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { teachingAssignmentConflict } from "./teaching-assignment-guard";
import {teachingAssignmentRevisionMatches,nextTeachingAssignmentRevision} from "./teaching-assignment-revision";
import {
  CoursesServiceError,
  postgresConstraintName,
} from "./errors";
import {
  loadCourseMembership,
  loadCourseScope,
  loadCourseSectionDeliveryScope,
  loadCourseTeachingAssignmentScope,
} from "./scope";
import {
  courseSectionDeliveryIdSchema,
  courseTeachingAssignmentIdSchema,
  createCourseTeachingAssignmentInputSchema,
  changeCourseTeachingAssignmentRoleInputSchema,
} from "./validation";

function mapTeachingConstraint(error: unknown) {
  switch (postgresConstraintName(error)) {
    case "course_teaching_assignments_active_uq":
      return new CoursesServiceError(
        "TEACHING_ASSIGNMENT_CONFLICT",
      );
    case "course_teaching_assignments_active_primary_uq":
      return new CoursesServiceError(
        "PRIMARY_TEACHER_CONFLICT",
      );
    default:
      return error;
  }
}

/** Compatibility read for legacy faculty/course associations.
 * Course identity resolves from UUID or stored immutable public slug, never
 * from loose course title, and all descendants remain college-authorized.
 * Delivery IDs are included because class/term is a teaching authorization
 * dimension in vNext; consumers must not elevate the aggregate to a grant.
 */
export async function listCourseFacultyAcrossDeliveries(
  context: RequestContext,
  courseIdOrSlug: string,
  includeEnded = false,
) {
  const key=courseIdOrSlug.trim();
  const validUuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key);
  const courseId=validUuid?key:null;
  const slug=/^[a-z0-9][a-z0-9-]{0,127}$/.test(key)?key:null;
  if(!courseId&&!slug)throw new CoursesServiceError("COURSE_NOT_FOUND");
  // Legacy slug lookup must stay in the currently selected college.
  const actingCollegeId=context.adminScope?.collegeId??context.membership?.collegeId;
  if(!actingCollegeId)throw new CoursesServiceError("COURSE_NOT_FOUND");
  const matches=await getDb().select({id:courses.id})
   .from(courses).innerJoin(departments,eq(departments.id,courses.departmentId))
   .where(and(eq(departments.collegeId,actingCollegeId),
    or(
     ...(courseId?[eq(courses.id,courseId)]:[]),
     ...(slug?[eq(courses.slug,slug)]:[]),
    ))).limit(2);
  if(matches.length!==1)throw new CoursesServiceError("COURSE_NOT_FOUND");
  const [match]=matches;
  const scoped=await loadCourseScope(match!.id,includeEnded);
  requirePermission(context,"courses.read",{
   collegeId:scoped.collegeId,organizationId:scoped.organizationId,
  });
  const conditions=[eq(courseOfferings.courseId,scoped.id),
    eq(departments.collegeId,scoped.collegeId),
    eq(colleges.organizationId,scoped.organizationId),
    eq(collegeMemberships.collegeId,scoped.collegeId)];
  if(!includeEnded){
   conditions.push(isNull(courseTeachingAssignments.endedAt));
   conditions.push(isNull(courseSectionDeliveries.endedAt));
   conditions.push(eq(collegeMemberships.status,"ACTIVE"));
   conditions.push(eq(users.platformStatus,"ACTIVE"));
   conditions.push(eq(courseOfferings.status,"ACTIVE"));
   conditions.push(eq(courses.status,"ACTIVE"));
  }
  return getDb().select({
    id:courseTeachingAssignments.id,
    membershipId:courseTeachingAssignments.membershipId,
    displayName:users.displayName,
    departmentId:departments.id,courseId:courses.id,
    courseName:courses.name,courseSlug:courses.slug,
    courseCode:courses.code,courseImageUrl:courses.imageUrl,
    deliveryId:courseTeachingAssignments.deliveryId,
    role:courseTeachingAssignments.role,
    startedAt:courseTeachingAssignments.startedAt,
    endedAt:courseTeachingAssignments.endedAt,
  }).from(courseTeachingAssignments)
   .innerJoin(courseSectionDeliveries,
     eq(courseSectionDeliveries.id,courseTeachingAssignments.deliveryId))
   .innerJoin(courseOfferings,
     eq(courseOfferings.id,courseSectionDeliveries.offeringId))
   .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
   .innerJoin(departments,eq(departments.id,courses.departmentId))
   .innerJoin(colleges,eq(colleges.id,departments.collegeId))
   .innerJoin(collegeMemberships,
     eq(collegeMemberships.id,courseTeachingAssignments.membershipId))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .where(and(...conditions))
   .orderBy(
     sql`case ${courseTeachingAssignments.role} when 'PRIMARY' then 0 when 'CO_TEACHER' then 1 else 2 end`,
     asc(users.displayName),asc(courseTeachingAssignments.id));
}

/** Exact legacy copy for the adapter presenting an authorized course mapping. */
export function teachingAssignmentLegacyMessage(code:string):string{
 switch(code){
  case "FACULTY_ROLE_REQUIRED": return "Faculty ID is required";
  case "SECTION_DELIVERY_NOT_FOUND": return "Select a class, course and semester for this teaching assignment.";
  case "TEACHING_ASSIGNMENT_NOT_FOUND": return "Teaching assignment not found";
  case "TEACHING_ASSIGNMENT_CONFLICT": return "This faculty assignment is already active in the selected class.";
  case "PRIMARY_TEACHER_CONFLICT": return "This class already has a primary faculty assignment.";
  case "FORBIDDEN": return "Only an admin can create, update, or remove faculty course associations";
  default: return "Could not update faculty course associations.";
 }
}

export async function listCourseTeachingAssignments(
  context: RequestContext,
  deliveryIdInput: string,
  includeEnded = false,
) {
  const deliveryId =
    courseSectionDeliveryIdSchema.parse(
      deliveryIdInput,
    );
  const delivery =
    await loadCourseSectionDeliveryScope(
      deliveryId,
      includeEnded,
    );

  requirePermission(context, "courses.read", {
    organizationId: delivery.organizationId,
    collegeId: delivery.collegeId,
  });

  const conditions = [
    eq(
      courseTeachingAssignments.deliveryId,
      deliveryId,
    ),
  ];

  if (!includeEnded) {
    conditions.push(
      isNull(courseTeachingAssignments.endedAt),
    );
  }

  return getDb()
    .select({
      id: courseTeachingAssignments.id,
      deliveryId:
        courseTeachingAssignments.deliveryId,
      membershipId:
        courseTeachingAssignments.membershipId,
      displayName: users.displayName,
      role: courseTeachingAssignments.role,
      courseSlug:courses.slug,courseName:courses.name,
      courseCode:courses.code,courseImageUrl:courses.imageUrl,
      departmentId:departments.id,
      startedAt:
        courseTeachingAssignments.startedAt,
      endedAt: courseTeachingAssignments.endedAt,
    })
    .from(courseTeachingAssignments)
    .innerJoin(
      courseSectionDeliveries,
      eq(courseSectionDeliveries.id, courseTeachingAssignments.deliveryId),
    )
    .innerJoin(courseOfferings, eq(courseOfferings.id, courseSectionDeliveries.offeringId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .innerJoin(departments, eq(departments.id, courses.departmentId))
    .innerJoin(colleges, eq(colleges.id, departments.collegeId))
    .innerJoin(
      collegeMemberships,
      eq(
        collegeMemberships.id,
        courseTeachingAssignments.membershipId,
      ),
    )
    .innerJoin(
      users,
      eq(users.id, collegeMemberships.userId),
    )
    // Scope again in the SELECT itself: delivery parents may have changed
    // after the pre-query authorization check. A stale grant must not
    // list faculty identities for another college or reassigned section.
    .where(and(
      ...conditions,
      eq(departments.collegeId, delivery.collegeId),
      eq(colleges.organizationId, delivery.organizationId),
      eq(courseSectionDeliveries.offeringId, delivery.offeringId),
      eq(courseSectionDeliveries.sectionId, delivery.sectionId),
    ))
    .orderBy(
      sql`case ${courseTeachingAssignments.role} when 'PRIMARY' then 0 when 'CO_TEACHER' then 1 else 2 end`,
      asc(users.displayName),asc(courseTeachingAssignments.id),
    );
}

export async function createCourseTeachingAssignment(
  context: RequestContext,
  rawInput: unknown,
) {
  const input =
    createCourseTeachingAssignmentInputSchema.parse(
      rawInput,
    );
  const [delivery, membership] =
    await Promise.all([
      loadCourseSectionDeliveryScope(
        input.deliveryId,
      ),
      loadCourseMembership(input.membershipId),
    ]);

  requirePermission(context, "courses.manage", {
    organizationId: delivery.organizationId,
    collegeId: delivery.collegeId,
  });

  if (membership.status !== "ACTIVE") {
    throw new CoursesServiceError(
      "MEMBERSHIP_NOT_ACTIVE",
    );
  }

  if (!membership.roles.includes("FACULTY")) {
    throw new CoursesServiceError(
      "FACULTY_ROLE_REQUIRED",
    );
  }

  if (
    membership.collegeId !== delivery.collegeId
  ) {
    throw new CoursesServiceError(
      "MEMBERSHIP_COLLEGE_MISMATCH",
    );
  }

  try {
    return await getDb().transaction(async (tx) => {
      // A previous delivery scope check can become stale while another
      // transaction ends this delivery. Pair SHARE with end's FOR UPDATE.
      const [liveDelivery] = await tx
        .select({ id: courseSectionDeliveries.id })
        .from(courseSectionDeliveries)
        .where(and(
          eq(courseSectionDeliveries.id, input.deliveryId),
          isNull(courseSectionDeliveries.endedAt),
        ))
        .for("update")
        .limit(1);

      if (!liveDelivery) {
        throw new CoursesServiceError("SECTION_DELIVERY_NOT_FOUND");
      }
      // A prior request-snapshot role is not sufficient to issue a grant.
      // Role revocation or suspension while this transaction waits on its
      // delivery lock must invalidate the assignment before any INSERT.
      await assertPersistedPlatformPermission(tx,context,"courses.manage",{
        collegeId:delivery.collegeId,organizationId:delivery.organizationId,
      });
      const [liveScope]=await tx.select({
        collegeId:departments.collegeId,
        organizationId:colleges.organizationId,
      }).from(courseSectionDeliveries)
       .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
       .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
       .innerJoin(departments,eq(departments.id,courses.departmentId))
       .innerJoin(colleges,eq(colleges.id,departments.collegeId))
       .where(eq(courseSectionDeliveries.id,input.deliveryId))
       .for("share").limit(1);
      if(!liveScope||liveScope.collegeId!==delivery.collegeId||
         liveScope.organizationId!==delivery.organizationId)
        throw new CoursesServiceError("SECTION_DELIVERY_NOT_FOUND");

      // A faculty member's college, active status or FACULTY role may
      // change after the earlier permission check. Lock the membership
      // and its role row to avoid assigning an already-revoked teacher.
      const [liveMember] = await tx
        .select({
          id: collegeMemberships.id,
          collegeId: collegeMemberships.collegeId,
          status: collegeMemberships.status,
        })
        .from(collegeMemberships)
        .where(eq(collegeMemberships.id, input.membershipId))
        .for("share")
        .limit(1);

      if (!liveMember || liveMember.status !== "ACTIVE") {
        throw new CoursesServiceError("MEMBERSHIP_NOT_ACTIVE");
      }
      if (liveMember.collegeId !== delivery.collegeId) {
        throw new CoursesServiceError("MEMBERSHIP_COLLEGE_MISMATCH");
      }

      const [facultyRole] = await tx
        .select({ id: membershipRoles.id })
        .from(membershipRoles)
        .where(and(
          eq(membershipRoles.membershipId, input.membershipId),
          eq(membershipRoles.role, "FACULTY"),
        ))
        .for("share")
        .limit(1);

      if (!facultyRole) {
        throw new CoursesServiceError("FACULTY_ROLE_REQUIRED");
      }

      const existing = await tx
        .select({
          membershipId: courseTeachingAssignments.membershipId,
          role: courseTeachingAssignments.role,
        })
        .from(courseTeachingAssignments)
        .where(and(
          eq(courseTeachingAssignments.deliveryId, input.deliveryId),
          isNull(courseTeachingAssignments.endedAt),
        ));
      const conflict = teachingAssignmentConflict(input, existing);
      if (conflict) {
        throw new CoursesServiceError(conflict);
      }

      const [created] = await tx
        .insert(courseTeachingAssignments)
        .values(input)
        .returning();

      if (!created) throw new CoursesServiceError("TEACHING_ASSIGNMENT_CONFLICT");
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.COURSES_TEACHING_ASSIGNED,
        collegeId: delivery.collegeId,
        organizationId: delivery.organizationId,
        subjectType: "course_teaching_assignment",
        subjectId: created.id,
        subjectLabel: input.role,
        summary: "Faculty teaching assignment created",
        metadata: {
          legacyAuditAction:"FACULTY_COURSE_ASSOCIATION_CREATE",
          after: {
            deliveryId: created.deliveryId,
            membershipId: created.membershipId,
            role: created.role,
            endedAt: null,
          },
        },
      });

      return created;
    });
  } catch (error) {
    if (error instanceof CoursesServiceError) throw error;
    throw mapTeachingConstraint(error);
  }
}

export async function endCourseTeachingAssignment(
  context: RequestContext,
  assignmentIdInput: string,
) {
  const assignmentId =
    courseTeachingAssignmentIdSchema.parse(
      assignmentIdInput,
    );
  const current =
    await loadCourseTeachingAssignmentScope(
      assignmentId,
    );

  requirePermission(context, "courses.manage", {
    organizationId: current.organizationId,
    collegeId: current.collegeId,
  });

  return getDb().transaction(async (tx) => {
    const [lockedAssignment] = await tx
      .select({ id: courseTeachingAssignments.id })
      .from(courseTeachingAssignments)
      .where(and(
        eq(courseTeachingAssignments.id, assignmentId),
        eq(courseTeachingAssignments.deliveryId, current.deliveryId),
        eq(courseTeachingAssignments.membershipId, current.membershipId),
        isNull(courseTeachingAssignments.endedAt),
      ))
      .for("update")
      .limit(1);

    if (!lockedAssignment) {
      throw new CoursesServiceError("TEACHING_ASSIGNMENT_NOT_FOUND");
    }

    await assertPersistedPlatformPermission(tx,context,"courses.manage",{
      collegeId:current.collegeId,organizationId:current.organizationId,
    });
    // The authorization above used the delivery's previous college. Hold
    // SHARE locks on its course/department/college chain and recheck that
    // neither tenant nor organization has moved before ending this role.
    const [liveScope] = await tx
      .select({
        collegeId: departments.collegeId,
        organizationId: colleges.organizationId,
      })
      .from(courseSectionDeliveries)
      .innerJoin(
        courseOfferings,
        eq(courseOfferings.id, courseSectionDeliveries.offeringId),
      )
      .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
      .innerJoin(departments, eq(departments.id, courses.departmentId))
      .innerJoin(colleges, eq(colleges.id, departments.collegeId))
      .innerJoin(organizations, eq(organizations.id, colleges.organizationId))
      .where(and(
        eq(courseSectionDeliveries.id, current.deliveryId),
        eq(colleges.status, "ACTIVE"),
        eq(organizations.status, "ACTIVE"),
      ))
      .for("share")
      .limit(1);

    if (!liveScope ||
        liveScope.collegeId !== current.collegeId ||
        liveScope.organizationId !== current.organizationId) {
      throw new CoursesServiceError("TEACHING_ASSIGNMENT_NOT_FOUND");
    }

    const now = new Date();
    const [updated] = await tx
      .update(courseTeachingAssignments)
      .set({
        endedAt: now,
        updatedAt: now,
      })
      .where(and(
        eq(courseTeachingAssignments.id, assignmentId),
        eq(courseTeachingAssignments.deliveryId, current.deliveryId),
        eq(courseTeachingAssignments.membershipId, current.membershipId),
        isNull(courseTeachingAssignments.endedAt),
      ))
      .returning();

    if (!updated) {
      throw new CoursesServiceError("TEACHING_ASSIGNMENT_NOT_FOUND");
    }

    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.COURSES_TEACHING_ENDED,
      collegeId: current.collegeId,
      organizationId: current.organizationId,
      subjectType: "course_teaching_assignment",
      subjectId: updated.id,
      subjectLabel: updated.role,
      summary: "Faculty teaching assignment ended",
      metadata: {
        legacyAuditAction:"FACULTY_COURSE_ASSOCIATION_DELETE",
        before: {
          deliveryId: current.deliveryId,
          membershipId: current.membershipId,
          role: current.role,
          endedAt: null,
        },
        after: {
          deliveryId: updated.deliveryId,
          membershipId: updated.membershipId,
          role: updated.role,
          endedAt: updated.endedAt?.toISOString() ?? null,
        },
      },
    });
    return updated;
  });
}


/** SA-academics-people-101: change a teaching role in place. A single locked
 * transaction preserves the assignment's identity and audit history; ending
 * and recreating in two requests could leave a class without its teacher. */
export async function changeCourseTeachingAssignmentRole(
  context: RequestContext,
  assignmentIdInput: string,
  roleInput: unknown,
) {
  const assignmentId = courseTeachingAssignmentIdSchema.parse(assignmentIdInput);
  const input = changeCourseTeachingAssignmentRoleInputSchema.parse(roleInput);
  const {role,expectedUpdatedAt} = input;
  const current = await loadCourseTeachingAssignmentScope(assignmentId);
  requirePermission(context,"courses.manage",{
    organizationId:current.organizationId,collegeId:current.collegeId,
  });
  try {
    return await getDb().transaction(async tx=>{
      const [liveDelivery]=await tx.select({id:courseSectionDeliveries.id})
        .from(courseSectionDeliveries)
        .where(and(
          eq(courseSectionDeliveries.id,current.deliveryId),
          isNull(courseSectionDeliveries.endedAt),
        )).for("update").limit(1);
      if(!liveDelivery)throw new CoursesServiceError("SECTION_DELIVERY_NOT_FOUND");
      const [locked]=await tx.select({
        id:courseTeachingAssignments.id,role:courseTeachingAssignments.role,
        updatedAt:courseTeachingAssignments.updatedAt,
        membershipId:courseTeachingAssignments.membershipId,
      }).from(courseTeachingAssignments)
        .where(and(
          eq(courseTeachingAssignments.id,assignmentId),
          eq(courseTeachingAssignments.deliveryId,current.deliveryId),
          eq(courseTeachingAssignments.membershipId,current.membershipId),
          isNull(courseTeachingAssignments.endedAt),
        )).for("update").limit(1);
      if(!locked)throw new CoursesServiceError("TEACHING_ASSIGNMENT_NOT_FOUND");
      // Compare while holding FOR UPDATE, before role changes and audit writes.
      // A monotonic revision protects against two writes within one millisecond.
      if(!teachingAssignmentRevisionMatches(locked.updatedAt,expectedUpdatedAt))
        throw new CoursesServiceError("TEACHING_ASSIGNMENT_CONFLICT");
      // Tenant ancestry is rechecked inside the same transaction after the
      // initial authorization; a transferred delivery cannot be mutated.
      const [scope]=await tx.select({
        collegeId:departments.collegeId,organizationId:colleges.organizationId,
      }).from(courseSectionDeliveries)
        .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
        .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
        .innerJoin(departments,eq(departments.id,courses.departmentId))
        .innerJoin(colleges,eq(colleges.id,departments.collegeId))
        .innerJoin(organizations,eq(organizations.id,colleges.organizationId))
        .where(and(
          eq(courseSectionDeliveries.id,current.deliveryId),
          eq(colleges.status,"ACTIVE"),eq(organizations.status,"ACTIVE"),
        )).for("share").limit(1);
      if(!scope||scope.collegeId!==current.collegeId||
         scope.organizationId!==current.organizationId)
        throw new CoursesServiceError("TEACHING_ASSIGNMENT_NOT_FOUND");
      const [member]=await tx.select({id:collegeMemberships.id,status:collegeMemberships.status,
        collegeId:collegeMemberships.collegeId})
        .from(collegeMemberships).where(eq(collegeMemberships.id,locked.membershipId))
        .for("share").limit(1);
      if(!member||member.status!=="ACTIVE"||member.collegeId!==current.collegeId)
        throw new CoursesServiceError("MEMBERSHIP_NOT_ACTIVE");
      const [facultyRole]=await tx.select({id:membershipRoles.id})
        .from(membershipRoles).where(and(
          eq(membershipRoles.membershipId,locked.membershipId),
          eq(membershipRoles.role,"FACULTY"),
        )).for("share").limit(1);
      if(!facultyRole)throw new CoursesServiceError("FACULTY_ROLE_REQUIRED");
      if(locked.role===role)return locked;
      const peers=await tx.select({membershipId:courseTeachingAssignments.membershipId,
        role:courseTeachingAssignments.role})
        .from(courseTeachingAssignments)
        .where(and(
          eq(courseTeachingAssignments.deliveryId,current.deliveryId),
          isNull(courseTeachingAssignments.endedAt),
        ));
      const conflict=teachingAssignmentConflict({membershipId:locked.membershipId,role},
        peers.filter(item=>item.membershipId!==locked.membershipId));
      if(conflict)throw new CoursesServiceError(conflict);
      const nextUpdatedAt=nextTeachingAssignmentRevision(locked.updatedAt);
      const [updated]=await tx.update(courseTeachingAssignments)
        .set({role,updatedAt:nextUpdatedAt})
        .where(and(
          eq(courseTeachingAssignments.id,assignmentId),
          eq(courseTeachingAssignments.deliveryId,current.deliveryId),
          eq(courseTeachingAssignments.membershipId,current.membershipId),
          isNull(courseTeachingAssignments.endedAt),
        )).returning();
      if(!updated)throw new CoursesServiceError("TEACHING_ASSIGNMENT_NOT_FOUND");
      await recordActivityEventInTransaction(tx,context,{
        eventType:ACTIVITY_EVENT_TYPES.COURSES_TEACHING_ASSIGNED,
        collegeId:current.collegeId,organizationId:current.organizationId,
        subjectType:"course_teaching_assignment",subjectId:assignmentId,
        subjectLabel:updated.role,summary:"Faculty teaching role changed",
        metadata:{legacyAuditAction:"FACULTY_COURSE_ASSOCIATION_UPDATE",
          before:{role:locked.role,membershipId:locked.membershipId},
          after:{role:updated.role,membershipId:updated.membershipId}},
      });
      return updated;
    });
  } catch(error) {
    if(error instanceof CoursesServiceError)throw error;
    throw mapTeachingConstraint(error);
  }
}

/** A legacy faculty-to-course association is now a projection across actual
 * classroom deliveries. Old ended rows remain visible only in history, never
 * as a current course-access grant. A faculty member may view their own
 * catalog; all other reads require scoped college authorization.
 */
export async function listFacultyTeachingCourseAssociations(
 context:RequestContext,facultyMembershipId:string,includeEnded=false,
){
 const membership=await loadCourseMembership(facultyMembershipId);
 if(context.membership?.id!==facultyMembershipId||includeEnded)
  requirePermission(context,"courses.read",{
   collegeId:membership.collegeId,organizationId:membership.organizationId,
  });
 const conditions=[
  eq(courseTeachingAssignments.membershipId,facultyMembershipId),
  eq(collegeMemberships.collegeId,membership.collegeId),
  eq(departments.collegeId,membership.collegeId),
 ];
 if(!includeEnded)conditions.push(
  isNull(courseTeachingAssignments.endedAt),
  isNull(courseSectionDeliveries.endedAt),
  eq(courseOfferings.status,"ACTIVE"),
  eq(courses.status,"ACTIVE"),
 );
 return getDb().select({
  assignmentId:courseTeachingAssignments.id,
  courseId:courses.id,courseSlug:courses.slug,courseName:courses.name,
  courseCode:courses.code,departmentId:departments.id,
  deliveryId:courseTeachingAssignments.deliveryId,
  role:courseTeachingAssignments.role,
  courseImageUrl:courses.imageUrl,
  startedAt:courseTeachingAssignments.startedAt,
  endedAt:courseTeachingAssignments.endedAt,
 }).from(courseTeachingAssignments)
 .innerJoin(courseSectionDeliveries,
  eq(courseSectionDeliveries.id,courseTeachingAssignments.deliveryId))
 .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
 .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
 .innerJoin(departments,eq(departments.id,courses.departmentId))
 .innerJoin(collegeMemberships,
  eq(collegeMemberships.id,courseTeachingAssignments.membershipId))
 .where(and(...conditions))
 .orderBy(asc(courses.name),asc(courseSectionDeliveries.id),
  asc(courseTeachingAssignments.id));
}

/** Legacy many-faculty/many-course imports are resolved to their explicit
 * live deliveries. No bulk call bypasses the per-row membership grant checks.
 * Report partial successes so the UI can retry only failed associations. */
export async function createTeachingAssignmentBatch(
 context:RequestContext,rows:readonly {
  deliveryId:string;membershipId:string;role?:"PRIMARY"|"CO_TEACHER"|"TA";
 }[],
){
 if(rows.length<1||rows.length>100)
  throw new CoursesServiceError("TEACHING_ASSIGNMENT_CONFLICT");
 const results:Array<{index:number;assignmentId?:string;error?:string}>=[];
 const seen=new Set<string>();
 for(const [index,row] of rows.entries()){
  const key=row.deliveryId+":"+row.membershipId;
  if(seen.has(key)){
   results.push({index,error:"TEACHING_ASSIGNMENT_CONFLICT"});continue;
  }
  seen.add(key);
  try{
   const created=await createCourseTeachingAssignment(context,{
    deliveryId:row.deliveryId,membershipId:row.membershipId,role:row.role??"PRIMARY",
   });
   results.push({index,assignmentId:created.id});
  }catch(cause){
   if(cause instanceof CoursesServiceError){
    results.push({index,error:cause.code});continue;
   }
   throw cause;
  }
 }
 return {total:rows.length,created:results.filter(r=>r.assignmentId).length,results};
}
