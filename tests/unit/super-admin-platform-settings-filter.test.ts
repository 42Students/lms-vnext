import {describe,expect,it} from "vitest";
import {adminInventoryFilterSchema,filterPlatformInventory} from "@/modules/platform-settings/admin-inventory-filter";
import type {PlatformSettingsSection} from "@/modules/platform-settings/model";
const sections:PlatformSettingsSection[]=[{id:"attendance",title:"Attendance",description:"",items:[{label:"Eligibility",value:75,source:"attendance_policies",origin:"COLLEGE_PERSISTED",scope:"PER_COLLEGE"}]},{id:"sms",title:"SMS",description:"",items:[],smsTemplates:[{key:"OTP",purpose:"Login",channels:["SMS"],definition:"FIXED_OTP_SOURCE",source:"src/modules/notifications/exotel-sms.ts"}]}];
describe("Super Admin safe settings inventory filters",()=>{
 it("searches visible setting labels and known source names",()=>{
  expect(filterPlatformInventory(sections,{q:"eligibility",section:"ALL"}).map(s=>s.id)).toEqual(["attendance"]);
  expect(filterPlatformInventory(sections,{q:"OTP",section:"ALL"}).map(s=>s.id)).toEqual(["sms"]);
 });
 it("rejects forged sections and overlong queries",()=>{
  expect(adminInventoryFilterSchema.safeParse({section:"secrets"}).success).toBe(false);
  expect(adminInventoryFilterSchema.safeParse({q:"x".repeat(101)}).success).toBe(false);
 });
});
