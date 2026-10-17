import {describe,it,expect} from "vitest";
import {normalizeRuntimeNumericSetting} from "@/modules/platform-settings/runtime-numeric-model";
import {readFileSync} from "node:fs";
const source=(path:string)=>readFileSync(path,"utf8");
describe("SA-tenants-modules-38 and SA-tenants-modules-39 global bounds",()=>{
 it("SA-tenants-modules-39 accepts valid configured announcement size but enforces the backend hard ceiling",()=>{
  expect(normalizeRuntimeNumericSetting("ops.announcementMaxPageSize","20",100)).toBe(20);
  expect(normalizeRuntimeNumericSetting("ops.announcementMaxPageSize","500",100)).toBe(100);
  expect(normalizeRuntimeNumericSetting("ops.announcementMaxPageSize","0",100)).toBeNull();
  expect(normalizeRuntimeNumericSetting("ops.announcementMaxPageSize","Infinity",100)).toBeNull();
  expect(normalizeRuntimeNumericSetting("ops.announcementMaxPageSize","25.5",100)).toBeNull();
 });
 it("SA-tenants-modules-38 supports bounded interview policy numbers and decimal thresholds",()=>{
  expect(normalizeRuntimeNumericSetting("interview.overlapBufferMinutes","15")).toBe(15);
  expect(normalizeRuntimeNumericSetting("placement.lowConversionThreshold","0.25")).toBe(0.25);
  expect(normalizeRuntimeNumericSetting("placement.lowConversionThreshold","2")).toBeNull();
  expect(normalizeRuntimeNumericSetting("interview.durationMinMinutes","0")).toBeNull();
  expect(normalizeRuntimeNumericSetting("interview.durationMaxMinutes","1441")).toBeNull();
 });
 it("SA-tenants-modules-39 caps actual announcement database pagination without changing global schema",()=>{
  const service=source("src/modules/announcements/service.ts");
  const reader=source("src/modules/platform-settings/runtime-numeric-service.ts");
  expect(reader).toContain('eq(platformSettingOverrides.scopeType,"GLOBAL")');
  expect(reader).toContain('eq(platformSettingOverrides.scopeId,"GLOBAL")');
  expect(service).toContain('readGlobalRuntimeNumber("ops.announcementMaxPageSize",100,100)');
  expect(service).toContain("const effectiveLimit=Math.min(input.limit,configuredMax)");
  expect(service).toContain(".limit(effectiveLimit + 1)");
  expect(service).toContain("rows.slice(0, effectiveLimit)");
 });
});
