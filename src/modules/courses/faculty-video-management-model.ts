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
