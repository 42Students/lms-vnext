import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
describe("faculty lesson management storage API wiring",()=>{
 const ui=readFileSync("src/components/courses/faculty-lesson-video-manager.tsx","utf8");
 const preview=readFileSync("src/components/courses/faculty-video-preview.tsx","utf8");
 it("exposes upload thumbnail replacement, publish, ordering, delete and content linking",()=>{
  for(const phrase of ["/videos${deliveryId?`?deliveryId=","uploadFacultyLessonVideo","uploadFacultyLessonThumbnail",
   "replaceVideoId","publishStatus:facultyVideoPublishAction","visibleToStudents:!video.visibleToStudents",
   "facultyVideoReorderPlan","/lesson-contents","video-asset/","lessonContentId:contentId",'"DELETE",undefined']){
    expect(ui).toContain(phrase);
  }
 });
 it("uses grants for preview, never raw bucket or public file URLs",()=>{
  expect(preview).toContain("/playback-grant");
  expect(preview).toContain("parseLearnerPlaybackGrant");
  expect(preview).not.toContain("localStorage");
  expect(preview).not.toContain("objectKey");
 });
});
