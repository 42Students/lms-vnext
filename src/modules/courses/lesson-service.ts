import {
  and,
  asc,
  eq,
  isNull,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { lockLiveLessonWriteAncestry } from "./lesson-write-ancestry";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { lessonMoveSchema, planLessonMove, collegeLessonBulkOrderSchema } from "./college-lesson-order-model";
import { courseLessons,lessonContents } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {
  can,
  requirePermission,
} from "@/modules/permissions/policy";
import {
  CoursesServiceError,
  postgresConstraintName,
} from "./errors";
import {
  requireLearningReadAccess,
} from "./learning-access";
import {
  loadCourseLessonScope,
  loadLearningPathScope,
} from "./scope";
import {
  courseLessonIdSchema,
  createCourseLessonInputSchema,
  learningPathIdSchema,
  updateCourseLessonInputSchema,
  type UpdateCourseLessonInput,
} from "./validation";

function mapLessonConstraint(error: unknown) {
  switch (postgresConstraintName(error)) {
    case "course_lessons_active_name_uq":
      return new CoursesServiceError(
        "LESSON_NAME_CONFLICT",
      );
    case "course_lessons_active_sequence_uq":
      return new CoursesServiceError(
        "LESSON_SEQUENCE_CONFLICT",
      );
    default:
      return error;
  }
}

export async function listCourseLessons(
  context: RequestContext,
  learningPathIdInput: string,
  deliveryId?: string | null,
  includeArchived = false,
) {
  const learningPathId =
    learningPathIdSchema.parse(
      learningPathIdInput,
    );
  const path = await loadLearningPathScope(
    learningPathId,
    includeArchived,
  );
  const access =
    await requireLearningReadAccess(
      context,
      path.offeringId,
      deliveryId,
      { includeHistorical: includeArchived },
    );

  if (access === "LEARNER") {
    if (path.status !== "PUBLISHED") {
      throw new CoursesServiceError(
        "LEARNING_PATH_NOT_PUBLISHED",
      );
    }
  }

  if (
    includeArchived &&
    !can(context, "courses.manage", {
      organizationId: path.organizationId,
      collegeId: path.collegeId,
    })
  ) {
    throw new CoursesServiceError(
      "LEARNING_ACCESS_DENIED",
    );
  }

  const conditions = [
    eq(
      courseLessons.learningPathId,
      learningPathId,
    ),
  ];

  if (!includeArchived) {
    conditions.push(
      eq(courseLessons.status, "ACTIVE"),
    );
  }
  if (access === "LEARNER") {
    conditions.push(eq(courseLessons.visibleToStudents, true));
  }

  return getDb()
    .select()
    .from(courseLessons)
    .where(and(...conditions))
    .orderBy(
      asc(courseLessons.sequence),
      asc(courseLessons.name),
    );
}

export async function createCourseLesson(
  context: RequestContext,
  rawInput: unknown,
) {
  const input =
    createCourseLessonInputSchema.parse(
      rawInput,
    );
  const path = await loadLearningPathScope(
    input.learningPathId,
  );

  requirePermission(context, "courses.manage", {
    organizationId: path.organizationId,
    collegeId: path.collegeId,
  });

  try {
    return await getDb().transaction(async (tx) => {
      // Path can be archived after loadLearningPathScope. Lock and recheck
      // in this transaction; path transition UPDATE conflicts with SHARE.
      await lockLiveLessonWriteAncestry(tx, path);

      const [last]=await tx.select({
        next:sql<number>`coalesce(max(${courseLessons.sequence}),-1)::int+1`,
      }).from(courseLessons).where(and(
       eq(courseLessons.learningPathId,path.id),eq(courseLessons.status,"ACTIVE"),
       isNull(courseLessons.deletedAt),
      ));
      const sequence=input.sequence&&input.sequence>0?input.sequence:last?.next??0;
      if(sequence>10000)throw new CoursesServiceError("LESSON_SEQUENCE_CONFLICT");
      const [created] = await tx
        .insert(courseLessons)
        .values({
          learningPathId:
            input.learningPathId,
          name: input.name,
          description:
            input.description ?? null,
          sequence,
          status:input.active===false?"ARCHIVED":"ACTIVE",
          visibleToStudents:input.enabled??input.visibleToStudents??true,
        })
        .returning();

      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.COURSES_LESSON_CREATED,
        collegeId: path.collegeId,
        organizationId: path.organizationId,
        subjectType: "course_lesson", subjectId: created.id,
        subjectLabel: created.name, summary: "Created lesson",
        metadata: { learningPathId: path.id, sequence: created.sequence,
          active:created.status==="ACTIVE",enabled:created.visibleToStudents },
      });
      return created;
    });
  } catch (error) {
    if (error instanceof CoursesServiceError) throw error;
    throw mapLessonConstraint(error);
  }
}

export async function updateCourseLesson(
  context: RequestContext,
  lessonIdInput: string,
  rawInput: UpdateCourseLessonInput,
) {
  const lessonId =
    courseLessonIdSchema.parse(
      lessonIdInput,
    );
  const input =
    updateCourseLessonInputSchema.parse(
      rawInput,
    );
  const current = await loadCourseLessonScope(lessonId);
  const path = await loadLearningPathScope(current.learningPathId);
  if (path.offeringId !== current.offeringId ||
      path.collegeId !== current.collegeId ||
      path.organizationId !== current.organizationId) {
    throw new CoursesServiceError("LESSON_NOT_FOUND");
  }
  requirePermission(context, "courses.manage", {
    organizationId: path.organizationId,
    collegeId: path.collegeId,
  });

  try {
    return await getDb().transaction(async (tx) => {
      await lockLiveLessonWriteAncestry(tx, path);
      const {expectedUpdatedAt,expectedVersion,active,enabled,visibleToStudents,sequence,...changes}=input;
      // Legacy sequence=0 means keep the existing order on an update; only
      // positive values intentionally reorder. Creation already appends for 0.
      const orderChange=sequence!==undefined&&sequence>0?{sequence}:{};
      // A lesson-deletion flag retains each child publication/draft state.
      // Only rows removed *with* this lesson receive the provenance marker.
      if(active===false){
       await tx.update(lessonContents).set({
        deletedWithLesson:true,updatedAt:new Date(),
       }).where(and(eq(lessonContents.lessonId,lessonId),
        eq(lessonContents.status,"PUBLISHED"),eq(lessonContents.deletedWithLesson,false),
        isNull(lessonContents.deletedAt)));
      }
      const [updated] = await tx
      .update(courseLessons)
      .set({
        ...changes,
        ...orderChange,
        ...(active===false?{status:"ARCHIVED" as const}:{}),
        ...((enabled??visibleToStudents)!==undefined?{visibleToStudents:enabled??visibleToStudents}:{}),
        version:sql`${courseLessons.version}+1`,
        updatedAt:sql<Date>`greatest(${courseLessons.updatedAt} + interval '1 millisecond',clock_timestamp())`,
      })
      .where(
        and(
          eq(courseLessons.id, lessonId),
          eq(courseLessons.status, "ACTIVE"),
          eq(courseLessons.learningPathId, current.learningPathId),
          ...(expectedVersion===undefined?[]:[eq(courseLessons.version,expectedVersion)]),
          sql`date_trunc('milliseconds',${courseLessons.updatedAt}) = ${expectedUpdatedAt}::timestamptz`,
        ),
      )
      .returning();

    if (!updated) {
      throw new CoursesServiceError(
        "LESSON_STALE_VERSION",
      );
    }

      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.COURSES_LESSON_UPDATED,
        collegeId: path.collegeId,
        organizationId: path.organizationId,
        subjectType: "course_lesson", subjectId: updated.id,
        subjectLabel: updated.name, summary: "Updated lesson",
        metadata: { learningPathId: path.id, previousSequence: current.sequence, sequence: updated.sequence },
      });
      return updated;
    });
  } catch (error) {
    if (error instanceof CoursesServiceError) {
      throw error;
    }
    throw mapLessonConstraint(error);
  }
}

export async function archiveCourseLesson(
  context: RequestContext,
  lessonIdInput: string,
) {
  const lessonId =
    courseLessonIdSchema.parse(
      lessonIdInput,
    );
  const current = await loadCourseLessonScope(lessonId);
  const path = await loadLearningPathScope(current.learningPathId);
  if (path.offeringId !== current.offeringId ||
      path.collegeId !== current.collegeId ||
      path.organizationId !== current.organizationId) {
    throw new CoursesServiceError("LESSON_NOT_FOUND");
  }
  requirePermission(context, "courses.manage", {
    organizationId: path.organizationId,
    collegeId: path.collegeId,
  });

  return getDb().transaction(async (tx) => {
    await lockLiveLessonWriteAncestry(tx, path);
    // Lock the lesson before changing visibility; new content creation
    // takes a matching SHARE lock on this row before its INSERT.
    const [liveLesson] = await tx
      .select({ id: courseLessons.id })
      .from(courseLessons)
      .where(and(
        eq(courseLessons.id, lessonId),
        eq(courseLessons.status, "ACTIVE"),
        eq(courseLessons.learningPathId, current.learningPathId),
      ))
      .for("update")
      .limit(1);

    if (!liveLesson) {
      throw new CoursesServiceError("LESSON_NOT_FOUND");
    }

    await tx.update(lessonContents).set({
      deletedWithLesson:true,updatedAt:new Date(),
    }).where(and(eq(lessonContents.lessonId,lessonId),
      eq(lessonContents.status,"PUBLISHED"),
      eq(lessonContents.deletedWithLesson,false),isNull(lessonContents.deletedAt)));
    const [updated] = await tx
      .update(courseLessons)
      .set({
        status: "ARCHIVED",
        version:sql`${courseLessons.version}+1`,
        updatedAt: new Date(),
      })
      .where(and(
        eq(courseLessons.id, lessonId),
        eq(courseLessons.status, "ACTIVE"),
        eq(courseLessons.learningPathId, current.learningPathId),
      ))
      .returning();

    if (!updated) {
      throw new CoursesServiceError("LESSON_NOT_FOUND");
    }

    return updated;
  });
}


/** COL-course-tabs-15: restore preserves historical progress and never revives
 * an archived parent path. The active lesson-name/sequence constraints still
 * apply; report conflicts rather than clobbering another lesson. */
export async function restoreCourseLesson(context: RequestContext, lessonIdInput: string) {
  const lessonId = courseLessonIdSchema.parse(lessonIdInput);
  const current = await loadCourseLessonScope(lessonId, true);
  const path = await loadLearningPathScope(current.learningPathId);
  if (path.offeringId !== current.offeringId || path.collegeId !== current.collegeId ||
      path.organizationId !== current.organizationId) {
    throw new CoursesServiceError("LESSON_NOT_FOUND");
  }
  requirePermission(context, "courses.manage", {
    collegeId: path.collegeId, organizationId: path.organizationId,
  });
  try {
    return await getDb().transaction(async tx => {
      await lockLiveLessonWriteAncestry(tx, path);
      const [restored] = await tx.update(courseLessons)
        .set({ status: "ACTIVE",version:sql`${courseLessons.version}+1`, updatedAt: new Date() })
        .where(and(eq(courseLessons.id, lessonId),
          eq(courseLessons.learningPathId, path.id), eq(courseLessons.status, "ARCHIVED")))
        .returning();
      if (!restored) throw new CoursesServiceError("LESSON_NOT_FOUND");
      // The parent archive never overwrites a child's own status; restore
      // only descendants archived as part of that parent action.
      await tx.update(lessonContents).set({
       deletedWithLesson:false,updatedAt:new Date(),
      }).where(and(eq(lessonContents.lessonId,lessonId),
       eq(lessonContents.deletedWithLesson,true),isNull(lessonContents.deletedAt)));
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.COURSES_LESSON_UPDATED,
        organizationId: path.organizationId, collegeId: path.collegeId,
        subjectType: "course_lesson", subjectId: restored.id,
        subjectLabel: restored.name, summary: "Restored lesson",
        metadata: {learningPathId: path.id, restoredFrom: "ARCHIVED"},
      });
      return restored;
    });
  } catch (error) {
    if (error instanceof CoursesServiceError) throw error;
    throw mapLessonConstraint(error);
  }
}

/** Move one active lesson one position in its own path with a stale-order fence.
 * Uses a temporary unoccupied sequence to respect the immediate unique index.
 */
export async function moveCollegeCourseLesson(context: RequestContext, raw: unknown) {
  const input = lessonMoveSchema.parse(raw);
  const path = await loadLearningPathScope(input.learningPathId);
  requirePermission(context, "courses.manage", {
    collegeId: path.collegeId, organizationId: path.organizationId,
  });
  return getDb().transaction(async tx => {
    await lockLiveLessonWriteAncestry(tx, path);
    const live = await tx.select({
      id: courseLessons.id, sequence: courseLessons.sequence,
    }).from(courseLessons)
      .where(and(eq(courseLessons.learningPathId, path.id), eq(courseLessons.status, "ACTIVE")))
      .orderBy(asc(courseLessons.sequence), asc(courseLessons.id))
      .for("update");
    const plan = planLessonMove(live, input);
    if (!plan) throw new CoursesServiceError("LESSON_SEQUENCE_CONFLICT");
    const [first, second] = plan;
    // Preserve the unordered gap while temporarily parking the source row.
    for (const step of [first, second, { id: first.id, sequence: second.previousSequence }]) {
      const [changed] = await tx.update(courseLessons)
        .set({ sequence: step.sequence, updatedAt: new Date() })
        .where(and(eq(courseLessons.id, step.id), eq(courseLessons.learningPathId, path.id), eq(courseLessons.status, "ACTIVE")))
        .returning({ id: courseLessons.id });
      if (!changed) throw new CoursesServiceError("LESSON_NOT_FOUND");
    }
    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.COURSES_LESSON_REORDERED,
      collegeId: path.collegeId, organizationId: path.organizationId,
      subjectType: "course_lesson", subjectId: input.lessonId,
      summary: "Reordered lesson", metadata: {
        learningPathId: path.id, from: first.previousSequence, to: second.previousSequence,
      },
    });
    return { lessonId: input.lessonId, sequence: second.previousSequence };
  });
}

// COL-course-tabs-14: one atomic replacement of the active shared Lesson order.
// Rows are locked and compared against the last visible order before mutation.
export async function reorderCollegeCourseLessons(context:RequestContext,raw:unknown){
 const input=collegeLessonBulkOrderSchema.parse(raw);
 const path=await loadLearningPathScope(input.learningPathId);
 requirePermission(context,"courses.manage",{
  collegeId:path.collegeId,organizationId:path.organizationId,
 });
 return getDb().transaction(async tx=>{
  await lockLiveLessonWriteAncestry(tx,path);
  const live=await tx.select({id:courseLessons.id,sequence:courseLessons.sequence})
   .from(courseLessons).where(and(eq(courseLessons.learningPathId,path.id),
    eq(courseLessons.status,"ACTIVE")))
   .orderBy(asc(courseLessons.sequence),asc(courseLessons.id))
   .for("update");
  if(live.length!==input.expected.length||
     live.some((item,index)=>item.id!==input.expected[index]?.id||
      item.sequence!==input.expected[index]?.sequence))
   throw new CoursesServiceError("LESSON_SEQUENCE_CONFLICT");
  const liveIds=new Set(live.map(item=>item.id));
  if(input.orderedIds.some(id=>!liveIds.has(id)))
   throw new CoursesServiceError("LESSON_SEQUENCE_CONFLICT");
  if(input.orderedIds.every((id,index)=>id===live[index]?.id))return {changed:false};
  // Parking every row above the current maximum avoids the unique
  // (learning_path_id, sequence) index during any arbitrary reorder.
  const firstTemporary=Math.max(...live.map(item=>item.sequence))+1;
  for(const [index,item] of live.entries()){
   await tx.update(courseLessons).set({
    sequence:firstTemporary+index,updatedAt:new Date(),
   }).where(and(eq(courseLessons.id,item.id),eq(courseLessons.learningPathId,path.id)));
  }
  for(const [index,id] of input.orderedIds.entries()){
   await tx.update(courseLessons).set({
    sequence:live[index]!.sequence,updatedAt:new Date(),
   }).where(and(eq(courseLessons.id,id),eq(courseLessons.learningPathId,path.id)));
  }
  await recordActivityEventInTransaction(tx,context,{
   eventType:ACTIVITY_EVENT_TYPES.COURSES_LESSON_REORDERED,
   collegeId:path.collegeId,organizationId:path.organizationId,
   subjectType:"course_learning_path",subjectId:path.id,
   summary:"Reordered shared lessons",
   metadata:{before:live.map(row=>row.id),after:input.orderedIds},
  });
  return {changed:true};
 });
}
