import {collegeLessonQuerySchema,type CollegeLessonQuery} from "./college-learning-directory-model";
import {collegeLessonVisibilityLabel} from "./college-course-tabs-copy";
import {buildCollegeDirectoryCsv,exportParams} from "@/modules/academics/college-directory-export-model";
export const LESSONS_EXPORT_CAP=1000;
export const lessonsCsvSchema=collegeLessonQuerySchema.omit({page:true});
export {exportParams};
export function lessonsCsvHref(q: Partial<Omit<CollegeLessonQuery,"page">>) {
 const p=new URLSearchParams();
 if(q.q)p.set("q",q.q);
 if(q.courseCode)p.set("courseCode",q.courseCode);
 if(q.programCode)p.set("programCode",q.programCode);
 if(q.cohortCode)p.set("cohortCode",q.cohortCode);
 if(q.periodCode)p.set("periodCode",q.periodCode);
 if(q.status&&q.status!=="ACTIVE")p.set("status",q.status);
 if(q.offeringStatus&&q.offeringStatus!=="ALL")p.set("offeringStatus",q.offeringStatus);
 if(q.pathStatus && q.pathStatus!=="ALL")p.set("pathStatus",q.pathStatus);
 if(q.offeringType&&q.offeringType!=="ALL")p.set("offeringType",q.offeringType);
 if(q.departmentName)p.set("departmentName",q.departmentName);
 if(q.contentPresence&&q.contentPresence!=="ALL")p.set("contentPresence",q.contentPresence);
 if(q.publishedContent&&q.publishedContent!=="ALL")p.set("publishedContent",q.publishedContent);
 if(q.flaggedVisibility&&q.flaggedVisibility!=="ALL")p.set("flaggedVisibility",q.flaggedVisibility);
 if(q.assignmentPresence&&q.assignmentPresence!=="ALL")p.set("assignmentPresence",q.assignmentPresence);
 if(q.quizPresence&&q.quizPresence!=="ALL")p.set("quizPresence",q.quizPresence);
 if(q.programStatus&&q.programStatus!=="ALL")p.set("programStatus",q.programStatus);
 if(q.cohortStatus&&q.cohortStatus!=="ALL")p.set("cohortStatus",q.cohortStatus);
 if(q.periodStatus&&q.periodStatus!=="ALL")p.set("periodStatus",q.periodStatus);
 if(q.courseStatus&&q.courseStatus!=="ALL")p.set("courseStatus",q.courseStatus);
 if(q.departmentCode)p.set("departmentCode",q.departmentCode);
 if(q.contentType&&q.contentType!=="ALL")p.set("contentType",q.contentType);
 if(q.contentLifecycle&&q.contentLifecycle!=="ALL")p.set("contentLifecycle",q.contentLifecycle);
 if(q.sequenceFrom!==undefined)p.set("sequenceFrom",String(q.sequenceFrom));
 if(q.sequenceThrough!==undefined)p.set("sequenceThrough",String(q.sequenceThrough));
 if(q.lessonName)p.set("lessonName",q.lessonName);
 if(q.contentAudience&&q.contentAudience!=="ALL")p.set("contentAudience",q.contentAudience);
 if(q.hiddenPublished&&q.hiddenPublished!=="ALL")p.set("hiddenPublished",q.hiddenPublished);
 if(q.videoEvidence&&q.videoEvidence!=="ALL")p.set("videoEvidence",q.videoEvidence);
 if(q.resourceEvidence&&q.resourceEvidence!=="ALL")p.set("resourceEvidence",q.resourceEvidence);
 if(q.liveEvidence&&q.liveEvidence!=="ALL")p.set("liveEvidence",q.liveEvidence);
 if(q.lessonId)p.set("lessonId",q.lessonId);
 if(q.offeringId)p.set("offeringId",q.offeringId);
 if(q.pathId)p.set("pathId",q.pathId);
 if(q.minContentCount!==undefined)p.set("minContentCount",String(q.minContentCount));
 if(q.maxContentCount!==undefined)p.set("maxContentCount",String(q.maxContentCount));
 return "/api/academics/college-lessons-export"+(p.size?"?"+p.toString():"");
}
export function renderLessonsCsv(rows:readonly {
 name:string;sequence:number;status:string;pathStatus:string;visibleToStudents:boolean;
 courseName:string;courseCode:string;cohortName:string;periodName:string;offeringStatus:string;
 contentCount:number;publishedContentCount:number;publishedAndVisibleFlagCount:number;
}[],truncated:boolean){
 return buildCollegeDirectoryCsv(["Lesson","Order","Lesson status","Path status","Course",
  "Course code","Batch","Period","Offering status","Students see it","Authored content","Published content","Published and visibility-flagged content"],
 rows.map(r=>[r.name,String(r.sequence+1),r.status,r.pathStatus,r.courseName,
  r.courseCode,r.cohortName,r.periodName,r.offeringStatus,collegeLessonVisibilityLabel(r),
  String(r.contentCount),String(r.publishedContentCount),String(r.publishedAndVisibleFlagCount)]),
 truncated,LESSONS_EXPORT_CAP);
}

// Versioned export above retains additional LMS vNext fields. This explicit
// preset defines the original six-column CSV and prevents positional drift.
export const LEGACY_LESSON_EXPORT_COLUMNS=[
 "id","lessonName","courseId","sequence","active","enabled",
] as const;
export const LESSON_EXPORT_CONTRACT_VERSION="2" as const;
export function legacyLessonCsvRow(input:{
 id:string;lessonName:string;courseId:string;sequence:number;active:boolean;enabled:boolean;
}):readonly string[]{
 return [input.id,input.lessonName,input.courseId,String(input.sequence),
  String(input.active),String(input.enabled)];
}
