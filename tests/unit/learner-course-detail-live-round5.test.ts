import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {liveSessionCountdown} from "@/components/courses/learner-live-session-status";
const code=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("learner live sessions and recovery",()=>{
 it("LEARNER-course-detail-09 displays live countdown, time range, safe join and copy link recovery",()=>{
  const start="2099-05-05T12:00:00Z",end="2099-05-05T13:00:00Z";
  expect(liveSessionCountdown(start,end,new Date("2099-05-05T10:50:00Z"))).toBe("Starts in 1 h 10 min");
  expect(liveSessionCountdown(start,end,new Date("2099-05-05T12:30:00Z"))).toBe("Live now");
  expect(liveSessionCountdown(start,end,new Date("2099-05-05T13:01:00Z"))).toBe("Ended");
  const ui=code("src/components/courses/learner-course-workspace.tsx");
  expect(ui).toContain("<LearnerLiveSessionStatus");
  expect(ui).toContain("No meeting link available yet.");
  const link=code("src/components/courses/learner-live-class-link.tsx");
  expect(link).toContain("Copy meeting link");
  expect(link).toContain("Join Meeting");
 });
 it("LEARNER-course-detail-13 shows recorded percentage watched alongside playback bar and status",()=>{
  const ui=code("src/components/courses/learner-course-workspace.tsx");
  expect(ui).toContain("{content.progress.percentComplete}% watched");
  expect(ui).toContain('label="Playback progress"');
  expect(ui).toContain("progressLabel(");
 });
 it("LEARNER-course-detail-18 warns when a requested lesson or content is not published",()=>{
  const ui=code("src/components/courses/learner-course-workspace.tsx");
  expect(ui).toContain("Lesson not found.");
  expect(ui).toContain("Content unavailable.");
  expect(ui).toContain("role=\"alert\"");
 });
});
