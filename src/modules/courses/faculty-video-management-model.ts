import {z} from "zod";

/**
 * UI-only adapter shape. The storage team maps authoritative server records to
 * this projection later. This module NEVER supplies credentials or URLs.
 */
export const facultyLessonVideoSchema=z.object({
  contentId:z.string().uuid(),
  lessonId:z.string().uuid(),
  deliveryId:z.string().uuid().nullable(),
  title:z.string().trim().min(1).max(255),
  sequence:z.number().int().min(0).max(10000),
  durationSeconds:z.number().int().min(1).max(86400).nullable(),
  processingStatus:z.enum(["QUEUED","UPLOADING","PROCESSING","READY","FAILED","BLOCKED"]),
  contentStatus:z.enum(["DRAFT","PUBLISHED","ARCHIVED"]),
  visibleToStudents:z.boolean(),
  updatedAt:z.iso.datetime({offset:true}),
}).strict();
export type FacultyLessonVideo=z.infer<typeof facultyLessonVideoSchema>;
export type FacultyVideoProcessingStatus=FacultyLessonVideo["processingStatus"];

/** UI-only defensive filtering; authenticated service must enforce the scope. */
export function facultyVideosForLesson(
 rows:readonly FacultyLessonVideo[],scope:{lessonId:string;deliveryId:string|null},
):FacultyLessonVideo[]{
 return rows.filter(row=>row.lessonId===scope.lessonId &&
   (scope.deliveryId===null?row.deliveryId===null:
     row.deliveryId===null||row.deliveryId===scope.deliveryId));
}

export type FacultyVideoBadge={label:string;tone:"neutral"|"warning"|"success"|"danger"};
export function facultyVideoStatusBadge(status:FacultyVideoProcessingStatus):FacultyVideoBadge{
 switch(status){
  case "QUEUED":return {label:"Queued",tone:"neutral"};
  case "UPLOADING":return {label:"Uploading",tone:"warning"};
  case "PROCESSING":return {label:"Processing",tone:"warning"};
  case "READY":return {label:"Ready",tone:"success"};
  case "FAILED":return {label:"Processing failed",tone:"danger"};
  case "BLOCKED":return {label:"Unavailable",tone:"danger"};
 }
}

export type FacultyVideoListFilter={
 search:string;status:FacultyVideoProcessingStatus|"ALL";
};
/** Searching operates only on safe title metadata, never hidden keys/URLs. */
export function facultyFilterLessonVideos(
 rows:readonly FacultyLessonVideo[],query:FacultyVideoListFilter,
):FacultyLessonVideo[]{
 const term=query.search.trim().toLocaleLowerCase();
 return rows.filter(row=>
  (query.status==="ALL"||row.processingStatus===query.status)&&
  (!term||row.title.toLocaleLowerCase().includes(term)));
}

/** Predictable stable order irrespective of asynchronously arriving status rows. */
export function facultyOrderLessonVideos(rows:readonly FacultyLessonVideo[]):FacultyLessonVideo[]{
 return [...rows].sort((a,b)=>
  a.sequence-b.sequence||a.title.localeCompare(b.title)||a.contentId.localeCompare(b.contentId));
}

/** Empty states distinguish a new lesson from a no-match or pending asset. */
export function facultyVideoListEmptyState(
 allCount:number,visibleCount:number,processingCount:number,
):string|null{
 if(visibleCount>0)return null;
 if(allCount===0)return "No videos have been added to this lesson.";
 if(processingCount>0)return "Videos are uploading or processing. Check the status again before publishing.";
 return "No videos match the current search or status filter.";
}

/** Only authorized Faculty can request replacement, never mid-upload or blocked. */
export function facultyVideoCanReplace(
 video:FacultyLessonVideo,canManage:boolean,
):boolean {
 return canManage && video.contentStatus!=="ARCHIVED" &&
  (video.processingStatus==="READY"||video.processingStatus==="FAILED");
}
export function facultyVideoReplacePrompt(video:FacultyLessonVideo):string {
 const title=video.title.slice(0,120);
 return "Replace the video for \""+title+"\"? The current recording may become unavailable while its replacement is processed. Existing lesson placement is kept.";
}

/** Future signed-upload adapter input; no storage key, URL or credentials accepted. */
export const facultyVideoReplaceIntentSchema=z.object({
 action:z.literal("REPLACE"),
 contentId:z.string().uuid(),
 lessonId:z.string().uuid(),
 deliveryId:z.string().uuid().nullable(),
 expectedUpdatedAt:z.iso.datetime({offset:true}),
 replacementUploadId:z.string().uuid(),
 confirmed:z.literal(true),
}).strict();
export type FacultyVideoReplaceIntent=z.infer<typeof facultyVideoReplaceIntentSchema>;
