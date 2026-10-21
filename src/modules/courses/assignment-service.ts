import { commandFacultyAssignment } from "./faculty-assignment-authoring-service";
import { facultyAssignmentLegacyEdit } from "./faculty-assignment-authoring-model";
import {
  and,
  asc,
  eq,
  isNull,
  ne,
  or,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  assignmentSubmissions,
  courseAssignments,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {
  can,
  requirePermission,
} from "@/modules/permissions/policy";
import {
  requireDeliveryContentMutation,
  requireLearningReadAccess,
} from "./learning-access";
import {
  CoursesServiceError,
  postgresConstraintName,
} from "./errors";
import {
  loadCourseLessonScope,
  loadCourseSectionDeliveryScope,
} from "./scope";
import {
  loadCourseAssignmentScope,
} from "./assignment-scope";
import {
  assignmentTransitionSchema,
  courseAssignmentIdSchema,
  createCourseAssignmentInputSchema,
  updateCourseAssignmentInputSchema,
  type CreateCourseAssignmentInput,
  type UpdateCourseAssignmentInput,
} from "./assignment-validation";
import {
  courseLessonIdSchema,
  courseSectionDeliveryIdSchema,
} from "./validation";

/** Legacy LessonContents(ASSIGNMENT) crosswalk into a distinct,
 * college-scoped courseAssignments row. Never accept a raw numeric lesson ID
 * as a UUID, and retain historical ordering within the resolved lesson.
 */
export function legacyAssignmentContentCrosswalk(
 source:{lessonContentId:number;lessonId:number;courseId:number;
  contentType:string;contentTitle:string;sequence:number;points:number;
  active:boolean|null;enabled:boolean|null;deadline:string|null},
 scoped:{lessonId:string;offeringId:string;resolvedCourseId:number;
  resolvedLegacyLessonId:number},
) {
 if(source.contentType.toUpperCase()!=="ASSIGNMENT" ||
    !Number.isSafeInteger(source.lessonContentId)||source.lessonContentId<1||
    source.lessonId!==scoped.resolvedLegacyLessonId||
    source.courseId!==scoped.resolvedCourseId||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(scoped.lessonId)||
    !Number.isSafeInteger(source.sequence)||source.sequence<0||
    !Number.isFinite(source.points)||source.points<0||
    !source.contentTitle.trim())return null;
 const due=source.deadline?new Date(source.deadline):null;
 if(due&& !Number.isFinite(due.getTime()))return null;
 return {
  historicalContentId:source.lessonContentId,
  lessonId:scoped.lessonId,offeringId:scoped.offeringId,
  title:source.contentTitle.trim(),sequence:source.sequence,
  maxPoints:source.points,dueAt:due,
  status:source.active===false?"ARCHIVED" as const:"DRAFT" as const,
  visibleToStudents:source.enabled!==false,
  // Publication and submission policy must be reviewed separately.
  requiresPublicationReview:true,
 };
}

function mapAssignmentConstraint(
  error: unknown,
) {
  switch (postgresConstraintName(error)) {
    case "course_assignments_generic_active_name_uq":
    case "course_assignments_delivery_active_name_uq":
      return new CoursesServiceError(
        "ASSIGNMENT_NAME_CONFLICT",
      );
    case "course_assignments_generic_active_sequence_uq":
    case "course_assignments_delivery_active_sequence_uq":
      return new CoursesServiceError(
        "ASSIGNMENT_SEQUENCE_CONFLICT",
      );
    default:
      return error;
  }
}

async function authorizeAssignmentMutation(
  context: RequestContext,
  assignment: Awaited<
    ReturnType<
      typeof loadCourseAssignmentScope
    >
  >,
) {
  if (assignment.deliveryId) {
    return requireDeliveryContentMutation(
      context,
      assignment.deliveryId,
    );
  }

  requirePermission(context, "courses.manage", {
    organizationId: assignment.organizationId,
    collegeId: assignment.collegeId,
  });
  return "ADMIN" as const;
}

export async function listCourseAssignments(
  context: RequestContext,
  lessonIdInput: string,
  deliveryIdInput?: string | null,
  includeArchived = false,
) {
  const lessonId =
    courseLessonIdSchema.parse(
      lessonIdInput,
    );
  const deliveryId = deliveryIdInput
    ? courseSectionDeliveryIdSchema.parse(
        deliveryIdInput,
      )
    : null;
  const lesson = await loadCourseLessonScope(
    lessonId,
    includeArchived,
  );
  const access =
    await requireLearningReadAccess(
      context,
      lesson.offeringId,
      deliveryId,
    );

  // COL-course-tabs-13: hidden lessons are unavailable even by a saved deep link.
  if (access === "LEARNER" && !lesson.visibleToStudents) {
    throw new CoursesServiceError("LESSON_NOT_FOUND");
  }

  if (
    access === "LEARNER" &&
    lesson.learningPathStatus !== "PUBLISHED"
  ) {
    throw new CoursesServiceError(
      "LEARNING_PATH_NOT_PUBLISHED",
    );
  }

  if (
    includeArchived &&
    !can(context, "courses.manage", {
      organizationId: lesson.organizationId,
      collegeId: lesson.collegeId,
    })
  ) {
    throw new CoursesServiceError(
      "LEARNING_ACCESS_DENIED",
    );
  }

  const audience = deliveryId
    ? or(
        isNull(courseAssignments.deliveryId),
        eq(
          courseAssignments.deliveryId,
          deliveryId,
        ),
      )
    : isNull(courseAssignments.deliveryId);

  const conditions = [
    eq(courseAssignments.lessonId, lessonId),
    audience,
  ];

  if (access === "LEARNER") {
    conditions.push(
      eq(
        courseAssignments.status,
        "PUBLISHED",
      ),
    );
  } else if (!includeArchived) {
    conditions.push(
      ne(
        courseAssignments.status,
        "ARCHIVED",
      ),
    );
  }

  return getDb()
    .select()
    .from(courseAssignments)
    .where(and(...conditions))
    .orderBy(
      asc(courseAssignments.sequence),
      asc(courseAssignments.createdAt),
      asc(courseAssignments.id),
    );
}

/** Read editable settings only after the same tenant-wide mutation authorization. */
export async function getCourseAssignmentForAdmin(context:RequestContext,assignmentIdInput:string){
 const assignmentId=courseAssignmentIdSchema.parse(assignmentIdInput);
 const scope=await loadCourseAssignmentScope(assignmentId);
 await authorizeAssignmentMutation(context,scope);
 const [row]=await getDb().select({
  id:courseAssignments.id,
  title:courseAssignments.title,
  description:courseAssignments.description,
  allowedMethods:courseAssignments.allowedSubmissionMethods,
  status:courseAssignments.status,
  dueAt:courseAssignments.dueAt,
  maxPoints:courseAssignments.maxPoints,
  updatedAt:courseAssignments.updatedAt,
 }).from(courseAssignments).where(eq(courseAssignments.id,assignmentId)).limit(1);
 if(!row)throw new CoursesServiceError("ASSIGNMENT_NOT_FOUND");
 const submissions=await getDb().select({id:assignmentSubmissions.id})
  .from(assignmentSubmissions).where(eq(assignmentSubmissions.assignmentId,assignmentId));
 return {...row,hasSubmissions:submissions.length>0,submissionCount:submissions.length};
}

export async function createCourseAssignment(
  context: RequestContext,
  rawInput: CreateCourseAssignmentInput,
) {
  const input =
    createCourseAssignmentInputSchema.parse(
      rawInput,
    );
  const lesson = await loadCourseLessonScope(
    input.lessonId,
  );

  if (input.deliveryId) {
    const delivery =
      await loadCourseSectionDeliveryScope(
        input.deliveryId,
      );

    if (
      delivery.offeringId !==
      lesson.offeringId
    ) {
      throw new CoursesServiceError(
        "ASSIGNMENT_DELIVERY_MISMATCH",
      );
    }

    await requireDeliveryContentMutation(
      context,
      input.deliveryId,
    );
  } else {
    requirePermission(
      context,
      "courses.manage",
      {
        organizationId: lesson.organizationId,
        collegeId: lesson.collegeId,
      },
    );
  }

  try {
    const [created] = await getDb()
      .insert(courseAssignments)
      .values({
        lessonId: input.lessonId,
        deliveryId:
          input.deliveryId ?? null,
        title: input.title,
        description:
          input.description ?? null,
        dueAt: input.dueAt
          ? new Date(input.dueAt)
          : null,
        maxPoints: input.maxPoints,
        ...(input.allowedMethods?{allowedSubmissionMethods:input.allowedMethods}:{}),
        sequence: input.sequence,
        createdByUserId: context.user.id,
      })
      .returning();

    return created;
  } catch (error) {
    throw mapAssignmentConstraint(error);
  }
}

export async function updateCourseAssignment(
  context: RequestContext,
  assignmentIdInput: string,
  rawInput: UpdateCourseAssignmentInput,
) {
  const assignmentId =
    courseAssignmentIdSchema.parse(
      assignmentIdInput,
    );
  const input =
    updateCourseAssignmentInputSchema.parse(
      rawInput,
    );
  const current =
    await loadCourseAssignmentScope(
      assignmentId,
    );

  const actor = await authorizeAssignmentMutation(
    context,
    current,
  );

  if (actor === "FACULTY" && current.deliveryId) {
    return commandFacultyAssignment(context, {deliveryId: current.deliveryId},
      facultyAssignmentLegacyEdit(current, input));
  }

  try {
    const [updated] = await getDb().transaction(async tx => {
      const [locked] = await tx.select().from(courseAssignments)
        .where(eq(courseAssignments.id,assignmentId)).for("update").limit(1);
      if(!locked||locked.status==="ARCHIVED")throw new CoursesServiceError("ASSIGNMENT_NOT_FOUND");
      const [submission]=await tx.select({id:assignmentSubmissions.id})
        .from(assignmentSubmissions).where(eq(assignmentSubmissions.assignmentId,assignmentId)).limit(1);
      if(submission)throw new CoursesServiceError("ASSIGNMENT_HAS_SUBMISSIONS");
      if(input.expectedUpdatedAt!==undefined&&new Date(input.expectedUpdatedAt).getTime()!==locked.updatedAt.getTime())
        throw new CoursesServiceError("FACULTY_ASSIGNMENT_STALE_VERSION");
      return tx.update(courseAssignments)
      .set({
        ...(input.title !== undefined
          ? { title: input.title }
          : {}),
        ...(input.description !== undefined
          ? {
              description:
                input.description,
            }
          : {}),
        ...(input.dueAt !== undefined
          ? {
              dueAt: input.dueAt
                ? new Date(input.dueAt)
                : null,
            }
          : {}),
        ...(input.maxPoints !== undefined
          ? {
              maxPoints: input.maxPoints,
            }
          : {}),
        ...(input.allowedMethods!==undefined?
          {allowedSubmissionMethods:input.allowedMethods}:{}),
        ...(input.sequence !== undefined
          ? { sequence: input.sequence }
          : {}),
        updatedAt: new Date(Math.max(Date.now(),locked.updatedAt.getTime()+1)),
      })
      .where(
        and(
          eq(
            courseAssignments.id,
            assignmentId,
          ),
          ne(
            courseAssignments.status,
            "ARCHIVED",
          ),
        ),
      )
      .returning();
    });

    if (!updated) {
      throw new CoursesServiceError(
        "ASSIGNMENT_NOT_FOUND",
      );
    }

    return updated;
  } catch (error) {
    if (error instanceof CoursesServiceError) {
      throw error;
    }
    throw mapAssignmentConstraint(error);
  }
}

export async function transitionCourseAssignment(
  context: RequestContext,
  assignmentIdInput: string,
  rawInput: unknown,
) {
  const assignmentId =
    courseAssignmentIdSchema.parse(
      assignmentIdInput,
    );
  const input =
    assignmentTransitionSchema.parse(
      rawInput,
    );
  const current =
    await loadCourseAssignmentScope(
      assignmentId,
    );

  const actor = await authorizeAssignmentMutation(
    context,
    current,
  );

  if (actor === "FACULTY" && current.deliveryId) {
    return commandFacultyAssignment(context,{deliveryId:current.deliveryId},{
      action:input.action,assignmentId:current.id,
      expectedUpdatedAt:input.expectedUpdatedAt,confirmed:input.confirmed,
    });
  }

  if (
    input.action === "PUBLISH" &&
    current.status !== "DRAFT"
  ) {
    throw new CoursesServiceError(
      "INVALID_ASSIGNMENT_TRANSITION",
    );
  }

  if (
    input.action === "PUBLISH" &&
    (!current.dueAt || current.dueAt.getTime() <= Date.now())
  ) {
    throw new CoursesServiceError(
      "ASSIGNMENT_DEADLINE_PASSED",
    );
  }

  const nextStatus =
    input.action === "PUBLISH"
      ? "PUBLISHED"
      : "ARCHIVED";

  const db = getDb();
  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(courseAssignments)
      .set({
        status: nextStatus,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(
            courseAssignments.id,
            assignmentId,
          ),
          ne(
            courseAssignments.status,
            "ARCHIVED",
          ),
        ),
      )
      .returning();

    if (!updated) {
      throw new CoursesServiceError(
        "ASSIGNMENT_NOT_FOUND",
      );
    }

    if (input.action === "PUBLISH") {
      await recordActivityEventInTransaction(
        tx,
        context,
        {
          eventType:
            ACTIVITY_EVENT_TYPES.COURSES_ASSIGNMENT_PUBLISHED,
          collegeId: current.collegeId,
          organizationId:
            current.organizationId,
          subjectType:
            "course_assignment",
          subjectId: updated.id,
          subjectLabel: updated.title,
          summary:
            `Assignment ${updated.title} published`,
          metadata: {
            learningPathId:
              current.learningPathId,
            offeringId:
              current.offeringId,
            deliveryId:
              updated.deliveryId,
          },
          groupKey:
            `course-offering:${current.offeringId}:publishing`,
          dedupeKey:
            `course-assignment:${updated.id}:published`,
        },
      );
    }

    return updated;
  });
}
