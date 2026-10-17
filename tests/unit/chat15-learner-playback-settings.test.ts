import {describe,it,expect} from "vitest";
import {learnerPlaybackSettingValue} from "@/modules/courses/learner-playback-settings";
describe("LEARNER-course-detail-12 playback settings",()=>{
 it("LEARNER-course-detail-12 accepts bounded persisted tunables and rejects malformed values",()=>{
  expect(learnerPlaybackSettingValue("ui.progressSaveIntervalMs","12000")).toBe(12000);
  expect(learnerPlaybackSettingValue("course.watchedThresholdPercent","85")).toBe(85);
  expect(learnerPlaybackSettingValue("course.watchedThresholdPercent","0")).toBeNull();
  expect(learnerPlaybackSettingValue("ui.progressSaveIntervalMs","200")).toBeNull();
  expect(learnerPlaybackSettingValue("ui.progressSaveIntervalMs","12s")).toBeNull();
 });
});
