import "server-only";

import { and, asc, count, eq, gte, ilike, inArray, isNotNull, isNull, lt, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/db/client";
import {lessonContentMaterials} from "@/db/schema/lesson-content-materials";
import {resourceMaterialsRuntimeEnabled} from "./resource-material-readiness";
import {parseLegacyResourceMaterialDrafts} from "./lesson-resource-materials-service";
import { aliasedColumn } from "@/db/aliased-column";
import {
  academicPeriods,
  cohorts,
  courseLearningPaths,
  courseLessons,
  courseOfferings,
  courseSectionDeliveries,
  sections,
  courses,
  departments,
  lessonContents,
  lessonVideoAssets,
  programs,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import {
  COLLEGE_CONTENT_PAGE_SIZE,
  collegeContentPageCount,
  collegeContentQuerySchema,
  collegeContentTypes,
  type CollegeContentKind,
} from "./college-content-aggregate-model";

import {collegeLiveClassQuerySchema,istDayBoundary} from "./college-live-classes-model";
const programDepartment = alias(departments, "content_program_department");

/**
 * College ownership is anchored independently at course department, cohort
 * program department, and academic period. Storage keys and external URLs are
 * intentionally never selected by these management aggregates.
 */
export async function listCollegeContentAggregate(
  context: RequestContext,
  kind: CollegeContentKind,
  rawQuery: unknown,
) {
  const live = kind === "LIVE_CLASS" ? collegeLiveClassQuerySchema.parse(rawQuery) : null;
  const defaultPageSize=kind==="RESOURCE"?15:kind==="VIDEO"?10:25;
  const query = collegeContentQuerySchema.parse(live ? {
    q:live.q,courseCode:live.courseCode,status:live.status,scope:live.scope,deliveryId:live.deliveryId,page:live.page,format:"ALL",visibility:"ALL",
  } : rawQuery);
  const pageSize=query.pageSize??defaultPageSize;
  const membership = context.membership;
  if (!membership || !hasMembershipRole(context, "COLLEGE_ADMIN") ||
      !can(context, "courses.read", {
        collegeId: membership.collegeId,
        organizationId: membership.organizationId,
      })) {
    throw new AuthorizationError("courses.read");
  }
  const collegeId = membership.collegeId;
  requirePermission(context, "courses.read", {
    collegeId,
    organizationId: membership.organizationId,
  });

  const db = getDb();
  const sectionOptions=await db.select({
    deliveryId:courseSectionDeliveries.id,offeringId:courseOfferings.id,
    sectionName:sections.name,sectionCode:sections.code,
    courseCode:courses.code,courseName:courses.name,
  }).from(courseSectionDeliveries)
    .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
    .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
    .innerJoin(departments,and(eq(departments.id,courses.departmentId),
      eq(departments.collegeId,collegeId)))
    .innerJoin(sections,and(eq(sections.id,courseSectionDeliveries.sectionId),
      eq(sections.cohortId,courseOfferings.cohortId),
      eq(sections.academicPeriodId,courseOfferings.academicPeriodId)))
    .where(and(isNull(courseSectionDeliveries.endedAt),eq(sections.status,"ACTIVE")))
    .orderBy(asc(courses.code),asc(sections.name)).limit(2000);
  const selectedSection=query.deliveryId?
    sectionOptions.find(item=>item.deliveryId===query.deliveryId):null;
  if(query.deliveryId&&!selectedSection)
    throw new AuthorizationError("courses.read");
  const scoped = db.select({
    id: aliasedColumn(lessonContents.id, "content_id"),
    lessonId: aliasedColumn(lessonContents.lessonId, "content_lesson_id"),
    // Only the server reads historical JSON; never send raw legacy payloads.
    legacyNotes: aliasedColumn(lessonContents.notes, "content_legacy_notes"),
    title: aliasedColumn(lessonContents.title, "content_title"),
    contentType: aliasedColumn(lessonContents.contentType, "content_content_type"),
    status: aliasedColumn(lessonContents.status, "content_status"),
    sequence: aliasedColumn(lessonContents.sequence, "content_sequence"),
    durationSeconds: aliasedColumn(lessonContents.durationSeconds, "content_duration_seconds"),
    points: aliasedColumn(lessonContents.points,"content_points"),
    dueAt: aliasedColumn(lessonContents.endsAt,"content_due_at"),
    deliveryId: aliasedColumn(lessonContents.deliveryId, "content_delivery_id"),
    visibleToStudents: aliasedColumn(lessonContents.visibleToStudents, "content_visible_to_students"),
    updatedAt: aliasedColumn(lessonContents.updatedAt, "content_updated_at"),
    lessonName: aliasedColumn(courseLessons.name, "content_lesson_name"),
    learningPathTitle: aliasedColumn(courseLearningPaths.title, "content_learning_path_title"),
    learningPathStatus: aliasedColumn(courseLearningPaths.status, "content_learning_path_status"),
    offeringId: aliasedColumn(courseOfferings.id, "content_offering_id"),
    offeringStatus: aliasedColumn(courseOfferings.status, "content_offering_status"),
    courseName: aliasedColumn(courses.name, "content_course_name"),
    courseCode: aliasedColumn(courses.code, "content_course_code"),
    cohortName: aliasedColumn(cohorts.name, "content_cohort_name"),
    periodName: aliasedColumn(academicPeriods.name, "content_period_name"),
    startsAt: aliasedColumn(lessonContents.startsAt,"content_starts_at"),
    endsAt: aliasedColumn(lessonContents.endsAt,"content_ends_at"),
  }).from(lessonContents)
    .innerJoin(courseLessons, eq(courseLessons.id, lessonContents.lessonId))
    .innerJoin(courseLearningPaths, eq(courseLearningPaths.id, courseLessons.learningPathId))
    .innerJoin(courseOfferings, eq(courseOfferings.id, courseLearningPaths.offeringId))
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .innerJoin(departments, and(
      eq(departments.id, courses.departmentId),
      eq(departments.collegeId, collegeId),
    ))
    .innerJoin(cohorts, eq(cohorts.id, courseOfferings.cohortId))
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(programDepartment, and(
      eq(programDepartment.id, programs.departmentId),
      eq(programDepartment.collegeId, collegeId),
    ))
    .innerJoin(academicPeriods, and(
      eq(academicPeriods.id, courseOfferings.academicPeriodId),
      eq(academicPeriods.collegeId, collegeId),
    ))
    .where(and(
      inArray(lessonContents.contentType,
        kind === "VIDEO" && query.format !== "ALL" ? [query.format] : [...collegeContentTypes(kind)]),
      query.status === "ALL" ? undefined : eq(lessonContents.status, query.status),
      kind !== "LIVE_CLASS" && query.offeringStatus && query.offeringStatus !== "ALL"
        ? eq(courseOfferings.status,query.offeringStatus) : undefined,
      query.courseCode ? eq(courses.code, query.courseCode) : undefined,
      kind !== "LIVE_CLASS" && query.programCode ? eq(programs.code,query.programCode) : undefined,
      kind !== "LIVE_CLASS" && query.cohortCode ? eq(cohorts.code,query.cohortCode) : undefined,
      kind !== "LIVE_CLASS" && query.periodCode ? eq(academicPeriods.code,query.periodCode) : undefined,
      kind !== "LIVE_CLASS" && query.departmentName ? eq(departments.name,query.departmentName) : undefined,
      kind !== "LIVE_CLASS" && query.offeringType && query.offeringType!=="ALL" ? eq(courseOfferings.type,query.offeringType) : undefined,
      kind !== "LIVE_CLASS" && query.lessonStatus && query.lessonStatus!=="ALL" ? eq(courseLessons.status,query.lessonStatus) : undefined,
      kind !== "LIVE_CLASS" && query.pathStatus && query.pathStatus!=="ALL" ? eq(courseLearningPaths.status,query.pathStatus) : undefined,
      kind !== "LIVE_CLASS" && query.visibility !== "ALL" ? eq(lessonContents.visibleToStudents,query.visibility === "VISIBLE") : undefined,
      selectedSection?eq(courseOfferings.id,selectedSection.offeringId):undefined,
      selectedSection?or(isNull(lessonContents.deliveryId),
        eq(lessonContents.deliveryId,selectedSection.deliveryId)):undefined,
      query.scope === "SHARED" ? isNull(lessonContents.deliveryId) : undefined,
      query.scope === "SECTION" ? isNotNull(lessonContents.deliveryId) : undefined,
      live?.view === "UPCOMING" ? gte(lessonContents.endsAt,new Date()) : undefined,
      live?.view === "PAST" ? lt(lessonContents.endsAt,new Date()) : undefined,
      live?.from ? gte(lessonContents.endsAt,istDayBoundary(live.from)) : undefined,
      live?.to ? lt(lessonContents.startsAt,istDayBoundary(live.to,true)) : undefined,
      query.q ? or(
        ilike(lessonContents.title, "%" + query.q.replace(/[\\%_]/g, "\\$&") + "%"),
        ilike(courseLessons.name, "%" + query.q.replace(/[\\%_]/g, "\\$&") + "%"),
        ilike(courses.name, "%" + query.q.replace(/[\\%_]/g, "\\$&") + "%"),
      ) : undefined,
    )).as("college_content_aggregate");

  const [counts, items] = await Promise.all([
    db.select({ total: count() }).from(scoped),
    db.select().from(scoped)
      .orderBy(asc(scoped.courseName), asc(scoped.lessonName), asc(scoped.sequence), asc(scoped.id))
      .limit(pageSize)
      .offset((query.page-1)*pageSize),
  ]);
  const total = counts[0]?.total ?? 0;
  const materialsReady=kind==="RESOURCE"&&resourceMaterialsRuntimeEnabled();
  const materialCounts=materialsReady&&items.length?
    await db.select({
      contentId:lessonContentMaterials.lessonContentId,
      total:count(),
    }).from(lessonContentMaterials)
     .where(inArray(lessonContentMaterials.lessonContentId,items.map(item=>item.id)))
     .groupBy(lessonContentMaterials.lessonContentId):[];
  const materialById=new Map(materialCounts.map(row=>[row.contentId,row.total]));
  // Registered, clean, active storage rows are the only ones safe to open.
  // Do not return objectKey or unsigned historical storageKey.
  const videoAssets=kind==="VIDEO"&&items.length?await db.select({
    id:lessonVideoAssets.id,lessonContentId:lessonVideoAssets.lessonContentId,
    lessonId:lessonVideoAssets.lessonId,deliveryId:lessonVideoAssets.deliveryId,
  }).from(lessonVideoAssets).where(and(
    inArray(lessonVideoAssets.lessonContentId,items.map(item=>item.id)),
    eq(lessonVideoAssets.collegeId,collegeId),
    eq(lessonVideoAssets.processingStatus,"READY"),
    eq(lessonVideoAssets.scanStatus,"CLEAN"),
    isNull(lessonVideoAssets.deletedAt),
  )):[];
  const annotated=items.map(({legacyNotes,...item})=>{
    const parsedLegacy=kind==="RESOURCE"?parseLegacyResourceMaterialDrafts(legacyNotes):[];
    const readyCount=materialsReady?materialById.get(item.id)??0:null;
    const matchedVideo=item.contentType==="VIDEO"?videoAssets.find(asset=>
      asset.lessonContentId===item.id&&asset.lessonId===item.lessonId&&
      (!asset.deliveryId||asset.deliveryId===item.deliveryId||!item.deliveryId)):null;
    const accessibleDelivery=matchedVideo?
      (matchedVideo.deliveryId??item.deliveryId??sectionOptions.find(section=>section.offeringId===item.offeringId)?.deliveryId??null):null;
    return {...item,
      materialsCount:readyCount,
      // Legacy JSON has not been imported into verified private storage.
      legacyMaterialsPending:kind==="RESOURCE"&&readyCount===0?parsedLegacy.length:0,
      legacyFilesPending:kind==="RESOURCE"&&readyCount===0?
        parsedLegacy.filter(draft=>draft.needsVerifiedFileImport).length:0,
      playback:matchedVideo&&accessibleDelivery?
        {videoId:matchedVideo.id,deliveryId:accessibleDelivery}:null,
    };
  });
  return {
    kind, query, sectionOptions, materialCountsReady:materialsReady, view:live?.view??"ALL", from:live?.from, to:live?.to, items:annotated, total,
    pageSize,
    totalPages: collegeContentPageCount(total,pageSize),
  };
}
