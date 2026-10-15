import "server-only";

import {randomUUID} from "node:crypto";
import {and,eq,inArray,isNull,ne,or,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {
  courseLearningPaths,courseLessons,lessonContents,
  courseTeachingAssignments,courseSectionDeliveries,sectionScheduleEvents,
} from "@/db/schema";
import {hasActiveMembership,hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {CoursesServiceError} from "./errors";
import {listFacultyCourseDeliveries} from "./faculty-course-service";
import {facultyLiveDeliveryLockKey} from "./faculty-live-lock-model";
import {facultyLivePublishedMutationAllowed} from "./faculty-live-published-policy";
import {facultyLiveMutationParamsSchema,facultyLiveMutationSchema,
  facultyLiveWindow} from "./faculty-live-mutation-model";

export async function commandFacultyLiveClass(
  context:RequestContext,rawParams:unknown,rawInput:unknown,
) {
  const params=facultyLiveMutationParamsSchema.parse(rawParams);
  const input=facultyLiveMutationSchema.parse(rawInput);
  const membership=context.membership;
  if(!membership||!hasActiveMembership(context)||!hasMembershipRole(context,"FACULTY")||
    !can(context,"courses.read",{
      collegeId:membership.collegeId,organizationId:membership.organizationId,
    }))throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  const deliveries=await listFacultyCourseDeliveries(context);
  const owned=deliveries.find(d=>d.deliveryId===params.deliveryId);
  if(!owned || owned.academicPeriodStatus==="CLOSED")
    throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  const dateFields=input.action==="CANCEL"?null:input;
  if(dateFields && !facultyLiveWindow(dateFields,{startDate:owned.periodStartDate,endDate:owned.periodEndDate}))
    throw new CoursesServiceError("CONTENT_TYPE_SHAPE_INVALID");

  const db=getDb();
  return db.transaction(async tx=>{
    // Serialize this Faculty actor's session writes, including across Sections.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"faculty-live:"+context.user.id}))`);
    // Serialize co-teachers for this Section, not just requests from one actor.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${facultyLiveDeliveryLockKey(params.deliveryId)}))`);
    // Rebuild the actor under SHARE locks, then assert the exact active Section.
    // A stale cookie cannot preserve write access after role or class revocation.
    let persisted:RequestContext;
    try {
      persisted=await assertPersistedPlatformPermission(tx,context,"courses.read",{
        collegeId:membership.collegeId,organizationId:membership.organizationId,
      });
    } catch {
      throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
    }
    if(!persisted.membership?.roles.includes("FACULTY")||
      persisted.membership.id!==membership.id)
      throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
    const [teaching]=await tx.select({id:courseTeachingAssignments.id})
      .from(courseTeachingAssignments)
      .innerJoin(courseSectionDeliveries,
        eq(courseSectionDeliveries.id,courseTeachingAssignments.deliveryId))
      .where(and(
        eq(courseTeachingAssignments.membershipId,membership.id),
        eq(courseTeachingAssignments.deliveryId,params.deliveryId),
        isNull(courseTeachingAssignments.endedAt),
        isNull(courseSectionDeliveries.endedAt),
      )).for("share").limit(1);
    if(!teaching)throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
    const [lesson]=input.action==="CREATE" ?
      await tx.select({id:courseLessons.id}).from(courseLessons)
        .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
        .where(and(eq(courseLessons.id,input.lessonId),
          eq(courseLessons.status,"ACTIVE"),eq(courseLearningPaths.offeringId,owned.offeringId)))
        .limit(1):[];
    if(input.action==="CREATE" && !lesson)
      throw new CoursesServiceError("LESSON_NOT_FOUND");
    let current:typeof lessonContents.$inferSelect|undefined;
    if(input.action!=="CREATE"){
      [current]=await tx.select().from(lessonContents).where(and(
        eq(lessonContents.id,input.contentId),
        eq(lessonContents.deliveryId,params.deliveryId),
        eq(lessonContents.contentType,"LIVE_CLASS"),
      )).for("update").limit(1);
      if(!current || current.status==="ARCHIVED")
        throw new CoursesServiceError("CONTENT_TYPE_SHAPE_INVALID");
      if(current.updatedAt.getTime()!==new Date(input.expectedUpdatedAt).getTime())
        throw new CoursesServiceError("LESSON_CONTENT_STALE_VERSION");
      // Draft or retired content cannot be rescheduled or cancelled through
      // the published-session editor, even with a forged version token.
      if(!facultyLivePublishedMutationAllowed(current.status))
        throw new CoursesServiceError("CONTENT_TYPE_SHAPE_INVALID");
    }
    if(dateFields){
      const allIds=deliveries.map(d=>d.deliveryId);
      const overlaps=await tx.select({id:lessonContents.id})
        .from(lessonContents).where(and(
          inArray(lessonContents.deliveryId,allIds),
          eq(lessonContents.contentType,"LIVE_CLASS"),
          eq(lessonContents.status,"PUBLISHED"),
          sql`${lessonContents.startsAt} < ${new Date(dateFields.endsAt)}`,
          sql`${lessonContents.endsAt} > ${new Date(dateFields.startsAt)}`,
          current?ne(lessonContents.id,current.id):undefined,
        )).limit(1);
      if(overlaps.length)throw new CoursesServiceError("SCHEDULE_EVENT_CONFLICT");
      // Legacy Section events and this instructor's other timetabled classes
      // are real occupancy; do not schedule an overlapping video meeting.
      const busy=await tx.select({id:sectionScheduleEvents.id})
        .from(sectionScheduleEvents).where(and(
          eq(sectionScheduleEvents.status,"SCHEDULED"),
          or(eq(sectionScheduleEvents.sectionId,owned.sectionId),
            eq(sectionScheduleEvents.facultyMembershipId,membership.id)),
          sql`${sectionScheduleEvents.startsAt} < ${new Date(dateFields.endsAt)}`,
          sql`${sectionScheduleEvents.endsAt} > ${new Date(dateFields.startsAt)}`,
        )).limit(1);
      if(busy.length)throw new CoursesServiceError("SCHEDULE_EVENT_CONFLICT");
    }
    let updated:typeof lessonContents.$inferSelect|undefined;
    const now=new Date(Math.max(Date.now(),(current?.updatedAt.getTime()??0)+1));
    if(input.action==="CREATE"){
      const [sequenceRow]=await tx.select({next:sql<number>`coalesce(max(${lessonContents.sequence}),-1)+1`})
        .from(lessonContents).where(eq(lessonContents.lessonId,input.lessonId));
      [updated]=await tx.insert(lessonContents).values({
        lessonId:input.lessonId,deliveryId:params.deliveryId,
        contentType:"LIVE_CLASS",title:input.title,externalUrl:input.meetingUrl,
        startsAt:new Date(input.startsAt),endsAt:new Date(input.endsAt),
        sequence:Number(sequenceRow?.next??0),status:"PUBLISHED",createdByUserId:context.user.id,
      }).returning();
    }else{
      const currentId=current!.id;
      [updated]=await tx.update(lessonContents).set(
        input.action==="CANCEL" ?
          {status:"ARCHIVED",updatedAt:now} :
          {title:input.title,externalUrl:input.meetingUrl,
            startsAt:new Date(input.startsAt),endsAt:new Date(input.endsAt),updatedAt:now},
      ).where(and(eq(lessonContents.id,currentId),
        eq(lessonContents.deliveryId,params.deliveryId))).returning();
    }
    if(!updated)throw new CoursesServiceError("CONTENT_TYPE_SHAPE_INVALID");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.COURSES_CLASS_SCHEDULED,
      collegeId:membership.collegeId,organizationId:membership.organizationId,
      subjectType:"lesson_content",subjectId:updated.id,
      subjectLabel:updated.title,
      summary:input.action==="CREATE"?"Faculty live class scheduled":
        input.action==="EDIT"?"Faculty live class rescheduled":"Faculty live class cancelled",
      metadata:{deliveryId:params.deliveryId,contentId:updated.id,
        action:input.action,startsAt:updated.startsAt?.toISOString()??null,
        endsAt:updated.endsAt?.toISOString()??null},
      groupKey:"course-delivery:"+params.deliveryId,
      dedupeKey:"faculty-live:"+updated.id+":"+input.action+":"+randomUUID(),
    });
    // NEVER return the raw meeting URL in logs or audit metadata.
    return {id:updated.id,updatedAt:updated.updatedAt,status:updated.status};
  });
}
