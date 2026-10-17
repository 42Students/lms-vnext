import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {learnerPlaybackSettingValue,LEARNER_PLAYBACK_DEFAULTS} from "@/modules/courses/learner-playback-settings";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("LEARNER-home-courses-22 bounded discussion refresh",()=>{
 it("LEARNER-home-courses-22 validates tenant-scoped central polling interval",()=>{
  expect(LEARNER_PLAYBACK_DEFAULTS.chatPollIntervalMs).toBe(15000);
  expect(learnerPlaybackSettingValue("ui.chatPollIntervalMs","30000")).toBe(30000);
  for(const value of ["0","500","4000","120001","not-a-number"])
   expect(learnerPlaybackSettingValue("ui.chatPollIntervalMs",value)).toBeNull();
 });
 it("LEARNER-home-courses-22 uses validated interval only while visible and allows configured failure fallback",()=>{
  const view=source("src/components/courses/learner-course-discussion.tsx");
  const server=source("src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx");
  expect(view).toContain("Math.max(5000,Math.min(120000,pollIntervalMs))");
  expect(view).toContain('document.visibilityState === "visible"');
  expect(server).toContain("readLearnerPlaybackSettings");
  expect(server).toContain("pollIntervalMs={chatSettings.chatPollIntervalMs}");
  expect(server).toContain(".catch(()=>({...LEARNER_PLAYBACK_DEFAULTS}))");
 });
});
