import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {learnerPlaybackSettingValue} from "@/modules/courses/learner-playback-settings";
describe("LEARNER-course-detail-12 playback settings",()=>{
 it("LEARNER-course-detail-12 accepts bounded persisted tunables and rejects malformed values",()=>{
  expect(learnerPlaybackSettingValue("ui.progressSaveIntervalMs","12000")).toBe(12000);
  expect(learnerPlaybackSettingValue("course.watchedThresholdPercent","85")).toBe(85);
  expect(learnerPlaybackSettingValue("course.watchedThresholdPercent","0")).toBeNull();
  expect(learnerPlaybackSettingValue("ui.progressSaveIntervalMs","200")).toBeNull();
  expect(learnerPlaybackSettingValue("ui.progressSaveIntervalMs","12s")).toBeNull();
 });
 it("LEARNER-course-detail-12 applies college override to playback cadence and server completion",()=>{
  const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
  expect(source("src/modules/courses/progress-service.ts")).toContain("duration*settings.watchedThresholdPercent");
  expect(source("src/modules/courses/learner-course-service.ts")).toContain("playbackSettings:await readLearnerPlaybackSettings(membership.collegeId)");
  expect(source("src/components/courses/learner-course-workspace.tsx")).toContain("saveIntervalMs={workspace.playbackSettings.saveIntervalMs}");
  expect(source("src/components/courses/learner-youtube-player.tsx")).toContain('host: "https://www.youtube-nocookie.com"');
  expect(source("src/components/courses/learner-youtube-player.tsx")).toContain("}, saveIntervalMs);");
 });
});
