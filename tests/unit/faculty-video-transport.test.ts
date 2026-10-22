import { describe, expect, it } from "vitest";
import { facultyVideoUploadTimeoutMs } from "@/components/courses/faculty-video-transfer";
import {
  MAX_THUMBNAIL_BYTES,
  MAX_VIDEO_BYTES,
  validateStorageDeclaration,
} from "@/modules/storage/file-policy";
import { lessonVideoPreselection } from "@/modules/storage/video-preselection";

const MIB=1024*1024;

describe("R2 signed single-PUT faculty media contract",()=>{
 it("accepts declared video payloads at 100 MiB, 1 GiB and 4900 MiB",()=>{
  for(const size of [100*MIB,1024*MIB,4900*MIB]){
   expect(lessonVideoPreselection({
    name:"lesson.mp4",type:"video/mp4",size,
   }).ok).toBe(true);
   expect(size).toBeLessThanOrEqual(MAX_VIDEO_BYTES);
  }
 });
 it("bounds a hanging upload without penalizing valid large videos",()=>{
  expect(facultyVideoUploadTimeoutMs(100*MIB)).toBe(15*60_000);
  expect(facultyVideoUploadTimeoutMs(1024*MIB)).toBe(4096*1000);
  expect(facultyVideoUploadTimeoutMs(4900*MIB)).toBe(19600*1000);
  expect(()=>facultyVideoUploadTimeoutMs(0)).toThrow("Invalid video size");
  expect(()=>facultyVideoUploadTimeoutMs(Number.POSITIVE_INFINITY)).toThrow();
 });
 it("preserves separate 5 MiB thumbnail and 4900 MiB video caps",()=>{
  expect(validateStorageDeclaration("lesson-video-thumbnail",{
   originalName:"preview.png",contentType:"image/png",sizeBytes:MAX_THUMBNAIL_BYTES,
  }).ok).toBe(true);
  expect(validateStorageDeclaration("lesson-video-thumbnail",{
   originalName:"preview.png",contentType:"image/png",
   sizeBytes:MAX_THUMBNAIL_BYTES+1,
  })).toEqual({ok:false,code:"STORAGE_FILE_TOO_LARGE"});
  expect(lessonVideoPreselection({
   name:"lesson.mp4",type:"video/mp4",size:MAX_VIDEO_BYTES+1,
  }).ok).toBe(false);
 });
});
