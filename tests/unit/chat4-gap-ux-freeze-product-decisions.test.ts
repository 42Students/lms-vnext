import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("chat-4 owner-delegated gap decisions: safe college policy",()=>{
 it("TPO-home-25 keeps team-wide operational counts inside the caller's college instead of silently hiding owned drives",()=>{
  const home=source("src/app/(authenticated)/tpo/home/page.tsx");
  const operations=source("src/modules/placements/tpo-operations-service.ts");
  expect(home).toContain("getPlacementTpoOperations(ctx,collegeId)");
  expect(operations).toContain("placementJobs.collegeId");
  expect(operations).not.toContain("team=false");
  expect(operations).not.toContain("onlyMyJobs");
 });
 it("COL-course-tabs-25 limits playback thresholds to validated persisted central overrides, not an unapproved college UI write",()=>{
  const model=source("src/modules/courses/learner-playback-settings.ts");
  const college=source("src/app/(authenticated)/college/videos/page.tsx");
  expect(model).toContain('course.watchedThresholdPercent');
  expect(model).toContain("n>=1&&n<=100");
  expect(model).toContain('platformSettingOverrides.scopeType,"GLOBAL"');
  // OD-34 and LEGACY_TENANT_SETTING_SPECS establish that the watched threshold
  // is GLOBAL-only. College overrides would violate that accepted policy.
  expect(model).not.toContain('platformSettingOverrides.scopeType,"COLLEGE"');
  const specs=source("src/modules/platform-settings/legacy-setting-specs.ts");
  expect(specs).toMatch(/"key": "course\.watchedThresholdPercent",\s*"scope": "GLOBAL"/);
  expect(college).not.toContain('name="course.watchedThresholdPercent"');
  expect(college).not.toContain("updatePlatformSettingOverrides");
 });
});
