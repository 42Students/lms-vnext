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
