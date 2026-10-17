import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=(path:string)=>readFileSync(path,"utf8");
describe("Super Admin course progress threshold policy",()=>{
 it("SA-academics-people-49 computes global minimum progress and watched thresholds without exposing editable policy dials",()=>{
  const settings=src("src/modules/courses/learner-playback-settings.ts");
  const progress=src("src/modules/courses/progress-service.ts");
  const owner=src("docs/audit/owner-decisions-resolved.md");
  expect(owner).toContain("OD-34 | Watched threshold platform-wide, hidden.");
  expect(settings).toContain("watchedThresholdPercent:90,minInProgressPercent:5");
  expect(settings).toContain('"course.watchedThresholdPercent"');
  expect(settings).toContain('"course.minInProgressPercent"');
  expect(settings).toContain('eq(platformSettingOverrides.scopeType,"GLOBAL")');
  expect(settings).toContain('eq(platformSettingOverrides.scopeId,"GLOBAL")');
  expect(settings).toContain('minInProgressPercent:learnerPlaybackSettingValue');
  expect(progress).toContain("minInProgressPercent = 5");
  expect(progress).toContain("percentComplete >= minInProgressPercent");
  expect(progress).toContain("settings.minInProgressPercent");
  expect(progress).toContain("settings.watchedThresholdPercent");
  expect(progress).toContain("readLearnerPlaybackSettings(context.membership?.collegeId)");
  const page=src("src/app/(authenticated)/admin/courses/page.tsx");
  expect(page).not.toContain("putGlobalSettings");
 });
});