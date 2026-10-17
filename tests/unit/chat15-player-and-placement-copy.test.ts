import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const get=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat-15 placements and player parity",()=>{
 it("LEARNER-placements-33 removes invented application metric tiles and disclaimer",()=>{
  const src=get("src/app/(authenticated)/learn/my-placements/applications/page.tsx");
  expect(src).not.toContain("Saved application status summary");
  expect(src).not.toContain("These are saved application records, not screening decisions");
 });
 it("LEARNER-placements-09 shows persisted notice bodies and relative ages in latest feed",()=>{
  const src=get("src/app/(authenticated)/learn/my-placements/page.tsx");
  expect(src).toContain("Latest from the placement cell");
  expect(src).toContain("{notice.message}");
  expect(src).toContain("learnerNoticeRelativeDay(notice.createdAt,new Date())");
 });
 it("LEARNER-course-detail-12 offers six legacy video playback speeds",()=>{
  const src=get("src/components/courses/learner-video-player.tsx");
  expect(src).toContain("[0.5,0.75,1,1.25,1.5,2]");
  expect(src).toContain("video.playbackRate=playbackRateRef.current");
  expect(src).toContain('aria-label="Playback speed"');
 });
});