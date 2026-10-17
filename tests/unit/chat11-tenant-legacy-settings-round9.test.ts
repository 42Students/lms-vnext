import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {LEGACY_TENANT_SETTING_MAP,LEGACY_TENANT_SETTING_SPECS} from "@/modules/platform-settings/legacy-setting-specs";

const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
const spec=(key:string)=>LEGACY_TENANT_SETTING_MAP.get(key);

describe("Tenant Settings legacy validated edit inventory",()=>{
 it("SA-tenants-modules-36 exposes sender and registered-message template overrides with explicit high-impact review",()=>{
  for(const key of ["sms.senderId","sms.attendanceAbsenceTemplate","sms.attendanceCorrectionTemplate","sms.traiJobUpdateTemplate"]){
   expect(spec(key)).toMatchObject({key,scope:"GLOBAL",group:"SMS",dangerous:true});
  }
  const editor=source("src/components/admin/tenant-settings-editor.tsx");
  const service=source("src/modules/platform-settings/admin-editor-service.ts");
  expect(editor).toContain("LEGACY_TENANT_SETTING_SPECS.filter(item=>item.scope===scopeType)");
  expect(editor).toContain("Review high-impact tenant setting changes");
  expect(service).toContain("spec.dangerous&&!parsed.confirmedHighImpact");
  expect(service).toContain("platformSettingOverrides");
  expect(service).toContain("Tenant setting changed");
 });
 it("SA-tenants-modules-37 validates watched/progress percentage and polling/save interval limits",()=>{
  for(const [key,min,max] of [
   ["course.watchedThresholdPercent",1,100],
   ["course.minInProgressPercent",0,100],
   ["ui.chatPollIntervalMs",3000,600000],
   ["ui.progressSaveIntervalMs",5000,600000],
  ] as const){
   expect(spec(key)).toMatchObject({scope:"GLOBAL",group:"Course & progress",type:"int",min,max});
  }
  expect(LEGACY_TENANT_SETTING_SPECS.filter(item=>item.group==="Course & progress")).toHaveLength(4);
  const editor=source("src/components/admin/tenant-settings-editor.tsx");
  expect(editor).toContain('min={"min" in spec?spec.min:undefined}');
  expect(editor).toContain('max={"max" in spec?spec.max:undefined}');
 });
 it("SA-tenants-modules-38 exposes every legacy placement timing, rate and risk setting",()=>{
  for(const [key,min,max] of [
   ["schedule.pastBookingGraceMinutes",0,1440],
   ["interview.overlapWindowMinutes",0,1440],
   ["interview.overlapBufferMinutes",0,1440],
   ["interview.durationMinMinutes",1,1440],
   ["interview.durationMaxMinutes",1,1440],
   ["placement.applyRateLimitPerMinute",1,1000],
   ["placement.staleAppliedDays",1,365],
   ["placement.closingSoonDays",1,365],
   ["placement.lowConversionThreshold",0,1],
   ["placement.needsAttentionSampleCap",1,1000],
  ] as const){
   const row=spec(key);
   expect(row).toMatchObject({key,scope:"GLOBAL",min,max});
   expect(["int","decimal"]).toContain(row?.type);
  }
  const page=source("src/app/(authenticated)/admin/settings/page.tsx");
  const editor=source("src/components/admin/tenant-settings-editor.tsx");
  expect(page).toContain("<TenantSettingsEditor");
  expect(editor).toContain("keys.filter(spec=>spec.group===group)");
 });
 it("SA-tenants-modules-39 exposes bounded operational caps with audited blank-to-default removal",()=>{
  for(const [key,min,max] of [
   ["ops.bulkStatusMax",1,10000],
   ["ops.progressBulkIdsMax",1,10000],
   ["ops.identityMaxJsonSize",100,1000000],
   ["ops.announcementMaxPageSize",1,10000],
  ] as const){
   expect(spec(key)).toMatchObject({scope:"GLOBAL",group:"Operational caps",type:"int",min,max});
  }
  const service=source("src/modules/platform-settings/admin-editor-service.ts");
  expect(service).toContain('if(trimmed==="")return null');
  expect(service).toContain('spec.type==="int"&&!Number.isSafeInteger(n)');
  expect(service).toContain("throw new TenantSettingEditorError(\"INVALID_SETTING\")");
  expect(service).toContain("await tx.delete(platformSettingOverrides)");
  expect(service).toContain("expectedVersion");
 });
});
