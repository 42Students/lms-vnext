import { z } from "zod";
import {LEARNING_PATH_STATUSES} from "@/modules/courses/constants";

export const COLLEGE_LEARNING_PAGE_SIZE = 25;
export const collegeLearningKindSchema = z.enum(["LESSONS", "PROGRESS"]);
export type CollegeLearningKind = z.infer<typeof collegeLearningKindSchema>;

export const collegeLearningQuerySchema = z.object({
  q: z.string().trim().max(100).default(""),
  status: z.enum(["ALL", "ACTIVE", "ARCHIVED"]).default("ACTIVE"),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  pageSize:z.coerce.number().int().refine(value=>[10,25,50,100].includes(value)).default(25),
}).strict();
export type CollegeLearningQuery = z.infer<typeof collegeLearningQuerySchema>;
export const collegeLessonQuerySchema = collegeLearningQuerySchema.extend({
  liveEvidence:z.enum(["ALL","HAS_LIVE","NO_LIVE"]).default("ALL"),
  resourceEvidence:z.enum(["ALL","HAS_RESOURCE","NO_RESOURCE"]).default("ALL"),
  videoEvidence:z.enum(["ALL","HAS_VIDEO","NO_VIDEO"]).default("ALL"),
  hiddenPublished:z.enum(["ALL","HAS_HIDDEN","NO_HIDDEN"]).default("ALL"),
  contentAudience:z.enum(["ALL","SHARED","SECTION"]).default("ALL"),
  lessonName: z.string().trim().min(1).max(255).optional(),
  sequenceThrough: z.coerce.number().int().min(1).max(10000).optional(),
  sequenceFrom: z.coerce.number().int().min(1).max(10000).optional(),
  contentLifecycle: z.enum(["ALL","DRAFT","PUBLISHED","ARCHIVED"]).default("ALL"),
  maxContentCount:z.coerce.number().int().min(0).max(1000).optional(),
  minContentCount:z.coerce.number().int().min(1).max(1000).optional(),
  pathId:z.string().uuid().optional(),
  offeringId:z.string().uuid().optional(),
  lessonId:z.string().uuid().optional(),
  contentType: z.enum(["ALL","RESOURCE","VIDEO","YOUTUBE","LIVE_CLASS"]).default("ALL"),
  programStatus: z.enum(["ALL","ACTIVE","ARCHIVED"]).default("ALL"),
  cohortStatus: z.enum(["ALL","PLANNED","ACTIVE","COMPLETED","ARCHIVED"]).default("ALL"),
  periodStatus: z.enum(["ALL","PLANNED","ACTIVE","CLOSED"]).default("ALL"),
  courseStatus: z.enum(["ALL","ACTIVE","ARCHIVED"]).default("ALL"),
  departmentCode: z.string().trim().min(1).max(64).optional(),
  offeringStatus: z.enum(["ALL", "ACTIVE", "ARCHIVED"]).default("ALL"),
  courseCode: z.string().trim().min(1).max(64).optional(),
  programCode: z.string().trim().min(1).max(64).optional(),
  cohortCode: z.string().trim().min(1).max(64).optional(),
  periodCode: z.string().trim().min(1).max(64).optional(),
  pathStatus: z.enum(["ALL",...LEARNING_PATH_STATUSES]).default("ALL"),
  offeringType: z.enum(["ALL","CORE","ELECTIVE"]).optional(),
  departmentName: z.string().trim().min(1).max(255).optional(),
  contentPresence: z.enum(["ALL","HAS_CONTENT","EMPTY"]).optional(),
  publishedContent: z.enum(["ALL","HAS_PUBLISHED","NONE_PUBLISHED"]).default("ALL"),
  flaggedVisibility:z.enum(["ALL","HAS_FLAGGED","NONE_FLAGGED"]).default("ALL"),
  assignmentPresence:z.enum(["ALL","HAS_ASSIGNMENTS","NO_ASSIGNMENTS"]).default("ALL"),
  quizPresence:z.enum(["ALL","HAS_QUIZZES","NO_QUIZZES"]).default("ALL"),
});
export type CollegeLessonQuery = z.infer<typeof collegeLessonQuerySchema>;
export const collegeProgressQuerySchema=collegeLearningQuerySchema.extend({
  sectionContentState:z.enum(["ALL","HAS_SECTION","NO_SECTION"]).default("ALL"),
  sharedContentState:z.enum(["ALL","HAS_SHARED","NO_SHARED"]).default("ALL"),
  hiddenContentState:z.enum(["ALL","HAS_HIDDEN","NO_HIDDEN"]).default("ALL"),
  publishedContentState:z.enum(["ALL","HAS_PUBLISHED","NO_PUBLISHED"]).default("ALL"),
  videoContentState:z.enum(["ALL","HAS_VIDEO","NO_VIDEO"]).default("ALL"),
  liveClassPresence:z.enum(["ALL","HAS_LIVE","NO_LIVE"]).default("ALL"),
  resourcePresence:z.enum(["ALL","HAS_RESOURCES","NO_RESOURCES"]).default("ALL"),
  quizPresence:z.enum(["ALL","HAS_QUIZZES","NO_QUIZZES"]).default("ALL"),
  assignmentPresence:z.enum(["ALL","HAS_ASSIGNMENTS","NO_ASSIGNMENTS"]).default("ALL"),
  lessonPresence:z.enum(["ALL","HAS_LESSONS","NO_LESSONS"]).default("ALL"),
  archivedContentState:z.enum(["ALL","HAS_ARCHIVED","NO_ARCHIVED"]).default("ALL"),
  draftContentState:z.enum(["ALL","HAS_DRAFT","NO_DRAFT"]).default("ALL"),
  offeringId:z.string().uuid().optional(),
  departmentCode:z.string().trim().min(1).max(64).optional(),
  courseStatus:z.enum(["ALL","ACTIVE","ARCHIVED"]).default("ALL"),
  periodStatus:z.enum(["ALL","PLANNED","ACTIVE","CLOSED"]).default("ALL"),
  cohortStatus:z.enum(["ALL","PLANNED","ACTIVE","COMPLETED","ARCHIVED"]).default("ALL"),
  programStatus:z.enum(["ALL","ACTIVE","ARCHIVED"]).default("ALL"),
  courseCode:z.string().trim().min(1).max(64).optional(),
  programCode:z.string().trim().min(1).max(64).optional(),
  periodCode:z.string().trim().min(1).max(64).optional(),
  cohortCode:z.string().trim().min(1).max(64).optional(),
  departmentName:z.string().trim().min(1).max(255).optional(),
  activityState:z.enum(["ALL","RECORDED","UNRECORDED"]).default("ALL"),
  completionEvidence:z.enum(["ALL","COMPLETED_CONTENT","NO_COMPLETED_CONTENT"]).default("ALL"),
  learningPathPresence:z.enum(["ALL","HAS_PATH","NO_PATH"]).default("ALL"),
  publishedPathPresence:z.enum(["ALL","HAS_PUBLISHED_PATH","NO_PUBLISHED_PATH"]).default("ALL"),
  offeringType:z.enum(["ALL","CORE","ELECTIVE"]).optional(),
});
export type CollegeProgressQuery=z.infer<typeof collegeProgressQuerySchema>;

export function collegeLearningHref(kind: CollegeLearningKind, query: CollegeLearningQuery | CollegeLessonQuery | CollegeProgressQuery) {
  const base = kind === "LESSONS" ? "/college/lessons" : "/college/course-progress";
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status !== "ACTIVE") params.set("status", query.status);
  if(kind==="PROGRESS"&&"sectionContentState" in query&&query.sectionContentState!=="ALL")params.set("sectionContentState",query.sectionContentState);
  if(kind==="PROGRESS"&&"sharedContentState" in query&&query.sharedContentState!=="ALL")params.set("sharedContentState",query.sharedContentState);
  if(kind==="PROGRESS"&&"hiddenContentState" in query&&query.hiddenContentState!=="ALL")params.set("hiddenContentState",query.hiddenContentState);
  if(kind==="PROGRESS"&&"publishedContentState" in query&&query.publishedContentState!=="ALL")params.set("publishedContentState",query.publishedContentState);
  if(kind==="PROGRESS"&&"videoContentState" in query&&query.videoContentState!=="ALL")params.set("videoContentState",query.videoContentState);
  if(kind==="LESSONS"&&"liveEvidence" in query&&query.liveEvidence!=="ALL")params.set("liveEvidence",query.liveEvidence);
  if(kind==="LESSONS"&&"resourceEvidence" in query&&query.resourceEvidence!=="ALL")params.set("resourceEvidence",query.resourceEvidence);
  if(kind==="LESSONS"&&"videoEvidence" in query&&query.videoEvidence!=="ALL")params.set("videoEvidence",query.videoEvidence);
  if(kind==="LESSONS"&&"hiddenPublished" in query&&query.hiddenPublished!=="ALL")params.set("hiddenPublished",query.hiddenPublished);
  if(kind==="LESSONS"&&"contentAudience" in query&&query.contentAudience!=="ALL")params.set("contentAudience",query.contentAudience);
  if(kind==="PROGRESS"&&"liveClassPresence" in query&&query.liveClassPresence!=="ALL")params.set("liveClassPresence",query.liveClassPresence);
  if(kind==="PROGRESS"&&"resourcePresence" in query&&query.resourcePresence!=="ALL")params.set("resourcePresence",query.resourcePresence);
  if(kind==="PROGRESS"&&"quizPresence" in query&&query.quizPresence!=="ALL")params.set("quizPresence",query.quizPresence);
  if(kind==="PROGRESS"&&"assignmentPresence" in query&&query.assignmentPresence!=="ALL")params.set("assignmentPresence",query.assignmentPresence);
  if(kind==="PROGRESS"&&"lessonPresence" in query&&query.lessonPresence!=="ALL")params.set("lessonPresence",query.lessonPresence);
  if (kind === "LESSONS" && "lessonName" in query && query.lessonName) params.set("lessonName", query.lessonName);
  if (kind === "LESSONS" && "sequenceThrough" in query && query.sequenceThrough !== undefined) params.set("sequenceThrough", String(query.sequenceThrough));
  if (kind === "LESSONS" && "sequenceFrom" in query && query.sequenceFrom !== undefined) params.set("sequenceFrom", String(query.sequenceFrom));
  if (kind === "LESSONS" && "contentLifecycle" in query && query.contentLifecycle !== "ALL") params.set("contentLifecycle", query.contentLifecycle);
  if(kind==="PROGRESS"&&"archivedContentState" in query&&query.archivedContentState!=="ALL")params.set("archivedContentState",query.archivedContentState);
  if(kind==="PROGRESS"&&"draftContentState" in query&&query.draftContentState!=="ALL")params.set("draftContentState",query.draftContentState);
  if(kind==="LESSONS"&&"maxContentCount" in query&&query.maxContentCount!==undefined)params.set("maxContentCount",String(query.maxContentCount));
  if(kind==="LESSONS"&&"minContentCount" in query&&query.minContentCount!==undefined)params.set("minContentCount",String(query.minContentCount));
  if(kind==="LESSONS"&&"pathId" in query&&query.pathId)params.set("pathId",query.pathId);
  if(kind==="PROGRESS"&&"offeringId" in query&&query.offeringId)params.set("offeringId",query.offeringId);
  if(kind==="LESSONS"&&"offeringId" in query&&query.offeringId)params.set("offeringId",query.offeringId);
  if(kind==="LESSONS"&&"lessonId" in query&&query.lessonId)params.set("lessonId",query.lessonId);
  if (kind === "LESSONS" && "contentType" in query && query.contentType !== "ALL") params.set("contentType", query.contentType);
  if (kind === "PROGRESS" && "departmentName" in query && query.departmentName) params.set("departmentName",query.departmentName);
  if(kind==="PROGRESS"&&"activityState" in query&&query.activityState!=="ALL")params.set("activityState",query.activityState);
  if(kind==="PROGRESS"&&"completionEvidence" in query&&query.completionEvidence!=="ALL")params.set("completionEvidence",query.completionEvidence);
  if(kind==="PROGRESS"&&"learningPathPresence" in query&&query.learningPathPresence!=="ALL")params.set("learningPathPresence",query.learningPathPresence);
  if(kind==="PROGRESS"&&"publishedPathPresence" in query&&query.publishedPathPresence!=="ALL")params.set("publishedPathPresence",query.publishedPathPresence);
  if (kind === "PROGRESS" && "offeringType" in query && query.offeringType && query.offeringType !== "ALL") params.set("offeringType",query.offeringType);
  if ("courseCode" in query && query.courseCode) params.set("courseCode",query.courseCode);
  if ("programCode" in query && query.programCode) params.set("programCode",query.programCode);
  if ("periodCode" in query && query.periodCode) params.set("periodCode",query.periodCode);
  if ("cohortCode" in query && query.cohortCode) params.set("cohortCode",query.cohortCode);
  if (kind === "LESSONS" && "quizPresence" in query && query.quizPresence!=="ALL") params.set("quizPresence",query.quizPresence);
  if (kind === "LESSONS" && "assignmentPresence" in query && query.assignmentPresence!=="ALL") params.set("assignmentPresence",query.assignmentPresence);
  if (kind === "LESSONS" && "flaggedVisibility" in query && query.flaggedVisibility!=="ALL") params.set("flaggedVisibility",query.flaggedVisibility);
  if (kind === "LESSONS" && "publishedContent" in query && query.publishedContent!=="ALL") params.set("publishedContent",query.publishedContent);
  if (kind === "LESSONS" && "contentPresence" in query && query.contentPresence && query.contentPresence!=="ALL")params.set("contentPresence",query.contentPresence);
  if (kind === "LESSONS" && "departmentName" in query && query.departmentName) params.set("departmentName",query.departmentName);
  if (kind === "LESSONS" && "offeringType" in query && query.offeringType && query.offeringType!=="ALL") params.set("offeringType",query.offeringType);
  if (kind === "LESSONS" && "pathStatus" in query && query.pathStatus !== "ALL") params.set("pathStatus",query.pathStatus);
  if (kind === "LESSONS" && "offeringStatus" in query && query.offeringStatus !== "ALL")
    params.set("offeringStatus", query.offeringStatus);
  if ("programStatus" in query && query.programStatus !== "ALL") params.set("programStatus",query.programStatus);
  if ("cohortStatus" in query && query.cohortStatus !== "ALL") params.set("cohortStatus",query.cohortStatus);
  if ("periodStatus" in query && query.periodStatus !== "ALL") params.set("periodStatus",query.periodStatus);
  if ("courseStatus" in query && query.courseStatus !== "ALL") params.set("courseStatus",query.courseStatus);
  if ("departmentCode" in query && query.departmentCode) params.set("departmentCode",query.departmentCode);
  if (query.page !== 1) params.set("page", String(query.page));
  if(query.pageSize!==25)params.set("pageSize",String(query.pageSize));
  return params.size ? base + "?" + params.toString() : base;
}

/** Scoped offering lookups include archived offering records, never inferred learner completion. */
export function collegeOfferingProgressHref(offeringId:string) {
  return collegeLearningHref("PROGRESS", collegeProgressQuerySchema.parse({
    offeringId:z.string().uuid().parse(offeringId), status:"ALL",
  }));
}
/** Reuses the authenticated lesson aggregate rather than a new unscoped detail read. */
export function collegeOfferingLessonsHref(offeringId:string) {
  return collegeLearningHref("LESSONS", collegeLessonQuerySchema.parse({
    offeringId:z.string().uuid().parse(offeringId), status:"ALL",
  }));
}
export function collegeLearningPageCount(total: number,pageSize=COLLEGE_LEARNING_PAGE_SIZE) {
  return Math.max(1, Math.ceil(total / pageSize));
}

export type CollegeLessonRecord = {
  id: string;
  name: string;
  // Preserve the fields selected by listCollegeLessons for lesson authoring.
  description: string | null;
  learningPathId: string;
  sequence: number;
  status: "ACTIVE" | "ARCHIVED";
  visibleToStudents: boolean;
  updatedAt: Date;
  pathStatus: string;
  offeringId: string;
  offeringStatus: string;
  courseName: string;
  courseCode: string;
  cohortName: string;
  periodName: string;
  contentCount: number;
  publishedContentCount: number;
  publishedAndVisibleFlagCount: number;
};

export type CollegeCourseProgressRecord = {
  offeringId: string;
  offeringStatus: string;
  courseName: string;
  courseCode: string;
  cohortName: string;
  periodName: string;
  recordedRows: number;
  completedRows: number;
  learnersWithRecords: number;
};

export function collegeProgressDescription(row: Pick<
  CollegeCourseProgressRecord, "recordedRows" | "completedRows" | "learnersWithRecords"
>) {
  return row.recordedRows === 0
    ? "No recorded learner content activity"
    : `${row.completedRows} completed content records of ${row.recordedRows}; ${row.learnersWithRecords} distinct learners with records`;
}

/** An exact historical DTO can only be formed after authorized resolution
 * of old numeric IDs and course slug. UUIDs or course codes are not drop-in
 * replacements for legacy IDs/slugs.
 */
export type LegacyLessonSearchDto = {
 id:number;lessonName:string;courseId:number;courseSlug:string;
 courseName:string;active:boolean;
};
export function collegeLessonLegacyDto(
 row:CollegeLessonRecord,
 resolved:{legacyLessonId:number|null;legacyCourseId:number|null;courseSlug:string|null},
):LegacyLessonSearchDto|null {
 const {legacyLessonId,legacyCourseId,courseSlug}=resolved;
 if(legacyLessonId===null||legacyCourseId===null||
    !Number.isSafeInteger(legacyLessonId)||legacyLessonId<1||
    !Number.isSafeInteger(legacyCourseId)||legacyCourseId<1||
    !courseSlug||!courseSlug.trim()||courseSlug.length>160)return null;
 return {
  id:legacyLessonId,lessonName:row.name,
  courseId:legacyCourseId,courseSlug:courseSlug.trim(),
  courseName:row.courseName,active:row.status==="ACTIVE",
 };
}
