import { z } from "zod";
import { isSafeSignedUrl, videoCanPublish, videoProcessingDescriptor, type VideoProcessingStatus, type VideoPublishStatus } from "@/modules/storage/ui-models";

const uuid=z.string().uuid();
export const managedVideoSchema=z.object({
  id:uuid, lessonId:uuid, deliveryId:uuid.nullable(), lessonContentId:uuid.nullable(),
  title:z.string().min(1), sequence:z.number().int().nonnegative(),
  publishStatus:z.enum(["DRAFT","PUBLISHED","ARCHIVED"]),
  visibleToStudents:z.boolean(), processingStatus:z.enum(["UPLOADING","PROCESSING","READY","FAILED","BLOCKED"]),
  durationSeconds:z.number().int().positive().nullable(), originalName:z.string().min(1),
  contentType:z.string().min(1), sizeBytes:z.number().int().positive(),
  thumbnailStatus:z.enum(["NONE","UPLOADING","READY"]),
  replacesVideoId:uuid.nullable(), failureCode:z.string().nullable(),
  createdAt:z.string(),updatedAt:z.string(),completedAt:z.string().nullable(),
});
export type ManagedVideo=z.infer<typeof managedVideoSchema>;
export function parseManagedVideos(input:unknown,lessonId:string,deliveryId:string):ManagedVideo[]{
 const rows=z.object({videos:z.array(managedVideoSchema)}).parse(input).videos;
 if(rows.some(video=>video.lessonId!==lessonId || (video.deliveryId!==null && video.deliveryId!==deliveryId)))
  throw new Error("Video list belongs to a different lesson or Section.");
 return rows.sort((a,b)=>a.sequence-b.sequence||a.id.localeCompare(b.id));
}
export function facultyVideoMayPublish(video:Pick<ManagedVideo,"processingStatus"|"publishStatus">):boolean {
 return videoCanPublish(video);
}
export function facultyVideoMayReplace(video:Pick<ManagedVideo,"processingStatus"|"publishStatus">):boolean {
 return video.publishStatus!=="ARCHIVED" && ["READY","FAILED","BLOCKED"].includes(video.processingStatus);
}
export function facultyVideoMayPreview(video:Pick<ManagedVideo,"processingStatus">):boolean {
 return videoProcessingDescriptor(video.processingStatus).usable;
}
export function facultyVideoPublishAction(video:Pick<ManagedVideo,"publishStatus">):VideoPublishStatus {
 return video.publishStatus==="PUBLISHED"?"DRAFT":video.publishStatus==="ARCHIVED"?"DRAFT":"PUBLISHED";
}
export function facultyVideoOrderPatch(target:ManagedVideo,delta:-1|1,rows:ManagedVideo[]):number|null{
 const current=rows.findIndex(video=>video.id===target.id);
 if(current<0||current+delta<0||current+delta>=rows.length)return null;
 return rows[current+delta]!.sequence;
}
export const videoUploadGrantSchema=z.object({
 video:managedVideoSchema,
 grant:z.object({
  videoId:uuid,method:z.literal("PUT"),
  uploadUrl:z.string().url().refine(isSafeSignedUrl),
  expiresAt:z.iso.datetime({offset:true}),
  requiredHeaders:z.record(z.string(),z.string()),
  originalName:z.string().min(1),
 }),
});
export function parseFacultyVideoUploadGrant(input:unknown,nowMs:number,expected:{
 lessonId:string; deliveryId:string; fileName:string; contentType:string; sizeBytes:number;
},thumbnailVideoId?:string){
 const {video,grant}=videoUploadGrantSchema.parse(input);
 const lifetime=Date.parse(grant.expiresAt)-nowMs;
 if(video.id!==grant.videoId || video.lessonId!==expected.lessonId ||
   video.deliveryId!==expected.deliveryId || (thumbnailVideoId && video.id!==thumbnailVideoId) ||
   (!thumbnailVideoId && video.originalName!==expected.fileName) ||
   grant.originalName!==expected.fileName || lifetime<=0 || lifetime>15*60_000 ||
   grant.requiredHeaders["content-type"]!==expected.contentType ||
   grant.requiredHeaders["x-amz-meta-expected-size"]!==String(expected.sizeBytes) ||
   grant.requiredHeaders["x-amz-meta-malware-scan-status"]!=="PENDING")
   throw new Error("The video upload grant does not match the chosen file.");
 const allowed=["content-type","x-amz-meta-upload-token","x-amz-meta-owner-membership-id","x-amz-meta-college-id","x-amz-meta-expected-size","x-amz-meta-malware-scan-status"];
 if(Object.keys(grant.requiredHeaders).length!==allowed.length ||
  allowed.some(k=>!Object.hasOwn(grant.requiredHeaders,k)) ||
  Object.entries(grant.requiredHeaders).some(([key,value])=>!allowed.includes(key)||!value||/[\r\n]/.test(value)))
   throw new Error("The video upload grant headers are unsafe.");
 return {video,grant};
}
export function managedVideoAfterAction(input:unknown,id:string,lessonId:string):ManagedVideo {
 const video=z.object({video:managedVideoSchema}).parse(input).video;
 if(video.id!==id||video.lessonId!==lessonId)throw new Error("Unexpected video in response.");
 return video;
}
export function facultyVideoStatus(status:VideoProcessingStatus){return videoProcessingDescriptor(status);}
