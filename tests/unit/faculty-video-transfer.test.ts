import {describe,it,expect,vi} from "vitest";
import { checkedFacultyVideoFile,uploadFacultyLessonVideo } from "@/components/courses/faculty-video-transfer";
const uuid=(n:number)=>"00000000-0000-4000-8000-"+String(n).padStart(12,"0");
const row={id:uuid(1),lessonId:uuid(2),deliveryId:uuid(3),lessonContentId:null,
 title:"Week 1",sequence:0,publishStatus:"DRAFT",visibleToStudents:false,processingStatus:"UPLOADING",
 durationSeconds:120,originalName:"lesson.mp4",contentType:"video/mp4",sizeBytes:4,
 thumbnailStatus:"NONE",replacesVideoId:null,failureCode:null,
 createdAt:"2026-10-16T10:00:00Z",updatedAt:"2026-10-16T10:00:00Z",completedAt:null};
const requiredHeaders={"content-type":"video/mp4","x-amz-meta-upload-token":"secret",
"x-amz-meta-owner-membership-id":uuid(4),"x-amz-meta-college-id":uuid(5),
"x-amz-meta-expected-size":"4","x-amz-meta-malware-scan-status":"PENDING"};
describe("faculty video upload protocol",()=>{
 it("rejects unsupported formats and oversized video before a grant",()=>{
  expect(()=>checkedFacultyVideoFile(new File(["x"],"danger.html",{type:"text/html"}),"lesson-video")).toThrow();
  expect(checkedFacultyVideoFile(new File(["1234"],"lesson.mp4",{type:"video/mp4"}),"lesson-video").contentType).toBe("video/mp4");
 });
 it("grants, uploads with only signed headers, then confirms before returning",async()=>{
  const fetcher=vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({video:row,grant:{
   videoId:uuid(1),method:"PUT",uploadUrl:"https://private.example.test/u?sig=1",
   expiresAt:new Date(Date.now()+600000).toISOString(),requiredHeaders,originalName:"lesson.mp4"
  }},{status:201})).mockResolvedValueOnce(Response.json({video:{...row,processingStatus:"READY"}}));
  const put=vi.fn().mockResolvedValue(undefined);
  const result=await uploadFacultyLessonVideo({lessonId:uuid(2),deliveryId:uuid(3),title:"Week 1",
   durationSeconds:120,file:new File(["1234"],"lesson.mp4",{type:"video/mp4"}),
   signal:new AbortController().signal,onProgress:()=>{}},fetcher,put);
  expect(result.processingStatus).toBe("READY");
  expect(fetcher.mock.calls.map(call=>call[0])).toEqual([
   `/api/courses/lessons/${uuid(2)}/videos`,`/api/courses/videos/${uuid(1)}/complete`
  ]);
  expect(put).toHaveBeenCalledWith("https://private.example.test/u?sig=1",requiredHeaders,expect.any(File),expect.any(AbortSignal),expect.any(Function));
  expect(fetcher.mock.calls[0]?.[1]?.method).toBe("POST");
 });
});
