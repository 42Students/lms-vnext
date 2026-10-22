import {
  and,
  asc,
  desc,
  eq,
  isNotNull,
  isNull,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {z} from "zod";
import {normalizedContentValues} from "./lesson-content-service";
import { lockLiveLessonWriteAncestry } from "./lesson-write-ancestry";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { lessonMoveSchema, planLessonMove, collegeLessonBulkOrderSchema } from "./college-lesson-order-model";
import {
 courseLessons,lessonContents,courseAssignments,courseQuizzes,
 learnerContentProgress,courseDiscussionMessages,lessonVideoAssets,
} from "@/db/schema";
import {hasMembershipRole,isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {
  AuthorizationError,
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
  createLessonContentInputSchema,
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
    eq(courseLessons.learningPathId, learningPathId),
    isNull(courseLessons.deletedAt),
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
      asc(courseLessons.id),
    );
}

export async function createCourseLesson(
  context: RequestContext,
  rawInput: unknown,
) {
  // Legacy lesson creation optionally nested multiple contentsDTOs. Validate
  // the whole payload before acquiring locks, and insert all children in the
  // same transaction. Invalid children roll back the parent and its audit.
  const rawObject=z.record(z.string(),z.unknown()).parse(rawInput);
  const {contentsDTOs,lessonName,...lessonFields}=rawObject;
  const input=createCourseLessonInputSchema.parse({
    ...lessonFields,name:lessonFields.name??lessonName,
  });
  const children=contentsDTOs===undefined?[]:
    z.array(z.record(z.string(),z.unknown())).max(50).parse(contentsDTOs);
  if(children.some(item=>item.lessonId!==undefined||item.deliveryId!=null||
     (item.classId!==undefined&&item.classId!==null&&item.classId!==0)))
    throw new CoursesServiceError("CONTENT_DELIVERY_MISMATCH");
  const path = await loadLearningPathScope(
    input.learningPathId,
  );

  // Shared syllabus structure is a college-admin operation. Faculty
  // may author their assigned Section's content, not add shared lessons.
  if(!isSuperAdmin(context)&&!hasMembershipRole(context,"COLLEGE_ADMIN"))
    throw new AuthorizationError("courses.manage");
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

      if(children.length){
        const normalized=children.map((raw,index)=>{
          const {type,contentName,name,url,classId,...fields}=raw;
          void classId; // Already checked as course-wide (null or 0).
          // Legacy contentName/type/url map to the current scoped content DTO.
          // Course-wide content has null deliveryId; class-specific content
          // must be authored separately by its own delivery owner.
          return createLessonContentInputSchema.parse({
            ...fields,lessonId:created.id,deliveryId:null,
            contentType:fields.contentType??type,
            title:fields.title??contentName??name,
            externalUrl:fields.externalUrl??url,
            sequence:fields.sequence??index,
          });
        });
        await tx.insert(lessonContents).values(normalized.map(item=>
          normalizedContentValues(item,context.user.id)));
      }
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.COURSES_LESSON_CREATED,
        collegeId: path.collegeId,
        organizationId: path.organizationId,
        subjectType: "course_lesson", subjectId: created.id,
        subjectLabel: created.name, summary: "Created lesson",
        metadata: { learningPathId: path.id, sequence: created.sequence,
          active:created.status==="ACTIVE",enabled:created.visibleToStudents,
          legacyAuditAction:"LESSON_CREATE",legacyParentCourseId:path.offeringId },
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
  // A Course move names a target Learning Path; its active tenant and child
  // audience must be checked under the write transaction.
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
  // Shared syllabus structure is a college-admin operation. Faculty
  // may author their assigned Section's content, not add shared lessons.
  if(!isSuperAdmin(context)&&!hasMembershipRole(context,"COLLEGE_ADMIN"))
    throw new AuthorizationError("courses.manage");
  requirePermission(context, "courses.manage", {
    organizationId: path.organizationId,
    collegeId: path.collegeId,
  });
  const targetPath=input.targetLearningPathId&&input.targetLearningPathId!==path.id
    ? await loadLearningPathScope(input.targetLearningPathId):null;
  if(targetPath){
    if(targetPath.collegeId!==path.collegeId||
       targetPath.organizationId!==path.organizationId)
      throw new CoursesServiceError("LESSON_NOT_FOUND");
    requirePermission(context,"courses.manage",{
      organizationId:targetPath.organizationId,collegeId:targetPath.collegeId,
    });
  }

  try {
    return await getDb().transaction(async (tx) => {
      // Lock both ancestral chains in UUID order, preventing reverse move
      // deadlocks and concurrent archival of the destination Course.
      const parents=targetPath?[path,targetPath].sort((a,b)=>a.id.localeCompare(b.id)):[path];
      for(const parent of parents)await lockLiveLessonWriteAncestry(tx,parent);
      const {expectedUpdatedAt,expectedVersion,active,enabled,visibleToStudents,
        sequence,targetLearningPathId,...changes}=input;
      // A competing publish/create holds a SHARE lesson lock. This exclusive
      // lock stabilizes the child set until the move is safely committed.
      const [locked]=await tx.select({id:courseLessons.id}).from(courseLessons)
        .where(and(eq(courseLessons.id,lessonId),
          eq(courseLessons.status,"ACTIVE"),
          eq(courseLessons.learningPathId,current.learningPathId)))
        .for("update").limit(1);
      if(!locked)throw new CoursesServiceError("LESSON_STALE_VERSION");
      let moveChanges:{learningPathId:string;sequence:number}|null=null;
      if(targetPath){
        if(targetPath.offeringId!==path.offeringId){
          // Learner progress and Section-scoped descendants cannot migrate
          // with a new offering. Untargeted, unattempted content follows the
          // Lesson; otherwise fail closed rather than leave orphan audiences.
          const [targeted,assignments,quizzes,progress,discussions,videos]=await Promise.all([
            tx.select({id:lessonContents.id}).from(lessonContents)
              .where(and(eq(lessonContents.lessonId,lessonId),
                isNotNull(lessonContents.deliveryId))).limit(1),
            tx.select({id:courseAssignments.id}).from(courseAssignments)
              .where(eq(courseAssignments.lessonId,lessonId)).limit(1),
            tx.select({id:courseQuizzes.id}).from(courseQuizzes)
              .where(eq(courseQuizzes.lessonId,lessonId)).limit(1),
            tx.select({id:learnerContentProgress.id}).from(learnerContentProgress)
              .innerJoin(lessonContents,eq(lessonContents.id,learnerContentProgress.lessonContentId))
              .where(eq(lessonContents.lessonId,lessonId)).limit(1),
            tx.select({id:courseDiscussionMessages.id}).from(courseDiscussionMessages)
              .innerJoin(lessonContents,eq(lessonContents.id,courseDiscussionMessages.lessonContentId))
              .where(eq(lessonContents.lessonId,lessonId)).limit(1),
            tx.select({id:lessonVideoAssets.id}).from(lessonVideoAssets)
              .where(eq(lessonVideoAssets.lessonId,lessonId)).limit(1),
          ]);
          if(targeted.length||assignments.length||quizzes.length||
             progress.length||discussions.length||videos.length)
            throw new CoursesServiceError("CONTENT_DELIVERY_MISMATCH");
        }
        const [last]=await tx.select({sequence:courseLessons.sequence})
          .from(courseLessons).where(and(
            eq(courseLessons.learningPathId,targetPath.id),
            eq(courseLessons.status,"ACTIVE"),
            isNull(courseLessons.deletedAt)))
          .orderBy(desc(courseLessons.sequence)).limit(1);
        const next=(last?.sequence??-1)+1;
        if(next>10000)throw new CoursesServiceError("LESSON_SEQUENCE_CONFLICT");
        moveChanges={learningPathId:targetPath.id,sequence:next};
      }
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
        ...(moveChanges??{}),
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
        metadata: { learningPathId: updated.learningPathId, previousLearningPathId:path.id,
          targetOfferingId:targetPath?.offeringId??path.offeringId,
          previousSequence:current.sequence,sequence:updated.sequence,
          legacyAuditAction:"LESSON_UPDATE",parentImmutable:!targetPath },
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

    // Parent archival hides every descendant through the read-scope check,
    // without overwriting independently DRAFT/ARCHIVED child statuses.
    // Records, learner submissions/progress and private file references survive.
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
        updatedAt:sql<Date>`greatest(${courseLessons.updatedAt} + interval '1 millisecond',clock_timestamp())`,
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
    await recordActivityEventInTransaction(tx, context, {
      eventType:ACTIVITY_EVENT_TYPES.COURSES_LESSON_UPDATED,
      collegeId:path.collegeId,organizationId:path.organizationId,
      subjectType:"course_lesson",subjectId:updated.id,
      subjectLabel:updated.name,summary:"Archived lesson",
      metadata:{learningPathId:path.id,legacyAuditAction:"LESSON_DELETE",
        softArchive:true,filesRetained:true,progressRetained:true,
        childPublicationPreserved:true},
    });
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
        .set({ status: "ACTIVE",version:sql`${courseLessons.version}+1`,
          updatedAt:sql<Date>`greatest(${courseLessons.updatedAt} + interval '1 millisecond',clock_timestamp())` })
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
        metadata: {learningPathId: path.id, restoredFrom: "ARCHIVED",
          legacyAuditAction:"LESSON_RESTORE",childStatusPreserved:true,
          filesRetained:true,progressRetained:true},
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
        legacyAuditAction:"LESSON_REORDER",
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
   metadata:{before:live.map(row=>row.id),after:input.orderedIds,
     legacyAuditAction:"LESSON_REORDER",optimisticOrderChecked:true},
  });
  return {changed:true};
 });
}
