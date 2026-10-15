import { describe,expect,it } from "vitest";
import { facultyVideoMayPublish,facultyVideoMayPreview,facultyVideoMayReplace,facultyVideoReorderPlan,facultyVideoPublishAction,parseFacultyVideoUploadGrant,parseManagedVideos } from "@/modules/courses/faculty-video-storage-model";
const uuid=(n:number)=>"00000000-0000-4000-8000-"+String(n).padStart(12,"0");
const row={
 id:uuid(1),lessonId:uuid(2),deliveryId:uuid(3),lessonContentId:null,title:"Lecture",sequence:0,
 publishStatus:"DRAFT",visibleToStudents:false,processingStatus:"UPLOADING",durationSeconds:120,
 originalName:"lesson.mp4",contentType:"video/mp4",sizeBytes:100,thumbnailStatus:"NONE",replacesVideoId:null,
 failureCode:null,createdAt:"2026-10-16T10:00:00Z",updatedAt:"2026-10-16T10:00:00Z",completedAt:null
};
const now=Date.parse("2026-10-16T10:00:00Z");
const headers={"content-type":"video/mp4","x-amz-meta-upload-token":"secret",
"x-amz-meta-owner-membership-id":uuid(4),"x-amz-meta-college-id":uuid(5),
"x-amz-meta-expected-size":"100","x-amz-meta-malware-scan-status":"PENDING"};
const grant={videoId:uuid(1),method:"PUT",uploadUrl:"https://private.example.test/u?signature=private",
 expiresAt:"2026-10-16T10:10:00Z",requiredHeaders:headers,originalName:"lesson.mp4"};
describe("faculty video secure UI contracts",()=>{
 it("rejects videos from a different teaching scope",()=>{
  expect(parseManagedVideos({videos:[row]},uuid(2),uuid(3))).toHaveLength(1);
  expect(()=>parseManagedVideos({videos:[{...row,deliveryId:uuid(8)}]},uuid(2),uuid(3))).toThrow();
 });
 it("accepts only the matching short lived upload and exact S3 metadata",()=>{
  const expected={lessonId:uuid(2),deliveryId:uuid(3),fileName:"lesson.mp4",contentType:"video/mp4",sizeBytes:100};
  expect(parseFacultyVideoUploadGrant({video:row,grant},now,expected).grant.videoId).toBe(row.id);
  for(const invalid of [
   {...grant,uploadUrl:"http://private.example.test"},
   {...grant,expiresAt:"2026-10-16T12:00:00Z"},
   {...grant,requiredHeaders:{...headers,authorization:"Bearer token"}},
   {...grant,requiredHeaders:{...headers,"x-amz-meta-expected-size":"101"}},
   {...grant,videoId:uuid(7)}
  ])expect(()=>parseFacultyVideoUploadGrant({video:row,grant:invalid},now,expected)).toThrow();
 });
 it("gates publish preview and replace on actual processing status",()=>{
  const video=parseManagedVideos({videos:[row]},uuid(2),uuid(3))[0]!;
  expect(facultyVideoMayPublish(video)).toBe(false);
  expect(facultyVideoMayPreview(video)).toBe(false);
  expect(facultyVideoMayReplace(video)).toBe(false);
  const ready={...video,processingStatus:"READY" as const};
  expect(facultyVideoMayPublish(ready)).toBe(true);
  expect(facultyVideoMayPreview(ready)).toBe(true);
  expect(facultyVideoMayReplace(ready)).toBe(true);
  expect(facultyVideoPublishAction({...ready,publishStatus:"PUBLISHED"})).toBe("DRAFT");
  expect(facultyVideoOrderPatch(ready,1,[ready,{...ready,id:uuid(8),sequence:1}])).toBe(1);
 });
});
