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

export const facultyVideoListFilterSchema=z.object({
 search:z.string().trim().max(120).default(""),
 status:z.enum(["ALL","QUEUED","UPLOADING","PROCESSING","READY","FAILED","BLOCKED"]).default("ALL"),
}).strict();
export type FacultyVideoListFilter=z.infer<typeof facultyVideoListFilterSchema>;
/** Searching operates only on safe title metadata, never hidden keys/URLs. */
export function facultyFilterLessonVideos(
 rows:readonly FacultyLessonVideo[],query:FacultyVideoListFilter,
):FacultyLessonVideo[]{
 const valid=facultyVideoListFilterSchema.parse(query);
 const term=valid.search.toLocaleLowerCase();
 return rows.filter(row=>
  (valid.status==="ALL"||row.processingStatus===valid.status)&&
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

/** Product-language Delete means an audited soft archive, never blob hard-delete. */
export function facultyVideoArchivePrompt(video:FacultyLessonVideo):string {
 return "Archive \""+video.title.slice(0,120)+"\" from this lesson? Learners will lose access, but historical records must be retained.";
}
export const facultyVideoArchiveIntentSchema=z.object({
 action:z.literal("ARCHIVE"),
 contentId:z.string().uuid(),
 lessonId:z.string().uuid(),
 deliveryId:z.string().uuid().nullable(),
 expectedUpdatedAt:z.iso.datetime({offset:true}),
 confirmed:z.literal(true),
}).strict();

/** UI explanation only. The backend performs enrollment and membership access checks. */
export function facultyVideoLearnerVisible(
 video:FacultyLessonVideo,context:{lessonPublished:boolean;learnerAuthorized:boolean},
):boolean {
 return context.learnerAuthorized&&context.lessonPublished&&
  video.contentStatus==="PUBLISHED"&&video.visibleToStudents&&video.processingStatus==="READY";
}
export function facultyVideoVisibilityLabel(
 video:FacultyLessonVideo,lessonPublished:boolean,
):string {
 if(video.processingStatus!=="READY")return "Unavailable until video processing clears";
 if(video.contentStatus!=="PUBLISHED"||!lessonPublished)return "Not published to learners";
 return video.visibleToStudents?"Visible to eligible learners":"Hidden from learners";
}

export const facultyVideoVisibilityIntentSchema=z.object({
 action:z.literal("SET_VISIBILITY"),
 contentId:z.string().uuid(),
 lessonId:z.string().uuid(),
 deliveryId:z.string().uuid().nullable(),
 visibleToStudents:z.boolean(),
 expectedUpdatedAt:z.iso.datetime({offset:true}),
 confirmed:z.literal(true),
}).strict();
/** Enabling access is impossible until the complete publication/readiness gate passes. */
export function facultyVideoCanEnableVisibility(
 video:FacultyLessonVideo,context:{canManage:boolean;lessonPublished:boolean},
):boolean {
 return context.canManage&&context.lessonPublished&&
   video.contentStatus==="PUBLISHED"&&video.processingStatus==="READY";
}

/** Narrow cards expose only safe enabled actions, without changing permissions. */
export type FacultyVideoAction="REPLACE"|"ARCHIVE"|"SHOW"|"HIDE";
export function facultyVideoCardActions(
 video:FacultyLessonVideo,context:{canManage:boolean;lessonPublished:boolean},
):FacultyVideoAction[]{
 if(!context.canManage||video.contentStatus==="ARCHIVED")return [];
 const actions:FacultyVideoAction[]=[];
 if(facultyVideoCanReplace(video,true))actions.push("REPLACE");
 actions.push("ARCHIVE");
 if(video.visibleToStudents) actions.push("HIDE");
 else if(facultyVideoCanEnableVisibility(video,context)) actions.push("SHOW");
 return actions;
}

/** Faculty export is safe metadata only; signed URLs/keys are never fields. */
function facultyVideoCsvCell(value:string|number):string {
 const clean=String(value).replaceAll("\r"," ").replaceAll("\n"," ").replaceAll("\t"," ").trim();
 const neutral=/^[=+@-]/.test(clean)?"'"+clean:clean;
 return '"'+neutral.replaceAll('"','""')+'"';
}
export function facultyVideoMetadataCsv(
 rows:readonly FacultyLessonVideo[],scope:{lessonId:string;deliveryId:string|null},
):string {
 const header=["Video","Processing status","Publication","Learner visibility","Duration seconds"];
 const content=facultyOrderLessonVideos(facultyVideosForLesson(rows,scope)).map(row=>
  [row.title,facultyVideoStatusBadge(row.processingStatus).label,
   row.contentStatus,row.visibleToStudents?"Shown":"Hidden",row.durationSeconds??""]
   .map(cell=>facultyVideoCsvCell(cell)).join(","));
 return [header.map(facultyVideoCsvCell).join(","),...content].join("\r\n")+"\r\n";
}

/** Reject mismatched or older processing status replies; allow legitimate retries. */
export function facultyVideoStatusUpdate(
 current:FacultyLessonVideo,next:unknown,
):FacultyLessonVideo|null{
 const parsed=facultyLessonVideoSchema.safeParse(next);
 if(!parsed.success)return null;
 const incoming=parsed.data;
 if(current.contentId!==incoming.contentId||current.lessonId!==incoming.lessonId ||
  current.deliveryId!==incoming.deliveryId)return null;
 const previous=Date.parse(current.updatedAt),latest=Date.parse(incoming.updatedAt);
 if(!Number.isFinite(latest)||!Number.isFinite(previous)||latest<=previous)return null;
 return incoming;
}
