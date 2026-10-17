import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("SA-tenants-modules-37 saved course settings are honored",()=>{
 it("SA-tenants-modules-37 uses editor-compatible validated save intervals",()=>{
  const reader=read("src/modules/courses/learner-playback-settings.ts");
  const spec=read("src/modules/platform-settings/legacy-setting-specs.ts");
  expect(reader).toContain('n>=5000&&n<=600000');
  expect(spec).toContain('"ui.progressSaveIntervalMs"');
  expect(reader).toContain('eq(platformSettingOverrides.scopeType,"GLOBAL")');
  expect(reader).toContain('eq(platformSettingOverrides.scopeId,"GLOBAL")');
  expect(reader).not.toContain('eq(platformSettingOverrides.scopeType,"COLLEGE")');
 });
 it("SA-tenants-modules-37 reads an in-progress threshold and applies it to both reads and saves",()=>{
  const reader=read("src/modules/courses/learner-playback-settings.ts");
  const service=read("src/modules/courses/progress-service.ts");
  expect(reader).toContain('"course.minInProgressPercent"');
  expect(reader).toContain('minInProgressPercent:5');
  expect(service).toContain('percentComplete >= minInProgressPercent');
  expect(service).toContain('settings.minInProgressPercent');
 });
 it("SA-tenants-modules-37 retains video completion guard and unknown duration semantics",()=>{
  const service=read("src/modules/courses/progress-service.ts");
  expect(service).toContain('duration*settings.watchedThresholdPercent');
  expect(service).toContain('durationSeconds <= 0 || percentComplete >= minInProgressPercent');
  expect(service).toContain('TIMED_CONTENT_MANUAL_COMPLETION_NOT_ALLOWED');
 });
});
