import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement} from "react";
import SuperAdminSettingsPage from "@/app/(authenticated)/admin/settings/page";

const state=vi.hoisted(()=>({
  role:"ADMIN" as "ADMIN"|"COLLEGE"|"DISABLED",selected:true,
  failure:"" as ""|"platform"|"editor"|"attendance",
  platformReads:0,editorReads:0,attendanceReads:0,
}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>({
    user:{id:"actor",identityUid:"platform",platformStatus:state.role==="DISABLED"?"DISABLED":"ACTIVE",
      systemRoles:state.role==="COLLEGE"?[]:["SUPER_ADMIN"]},
    membership:null,
    adminScope:state.selected?{organizationId:"org",collegeId:"11111111-1111-4111-8111-111111111111"}:null,
  }),
}));
vi.mock("@/modules/platform-settings/service",()=>({
  getSuperAdminPlatformSettings:async()=>{
    state.platformReads++;
    if(state.failure==="platform")throw Error("PRIVATE_PLATFORM_DB_PASSWORD");
    return {selectedCollegeName:"IIT Dharwad",sections:[]};
  },
}));
vi.mock("@/modules/platform-settings/admin-editor-service",()=>({
  listAdminTenantSettings:async()=>{
    state.editorReads++;
    if(state.failure==="editor")throw Error("PRIVATE_SETTINGS_DB_PASSWORD");
    return {ready:true,entries:[]};
  },
}));
vi.mock("@/modules/attendance/policy-service",()=>({
  getCollegeAttendancePolicy:async()=>{
    state.attendanceReads++;
    if(state.failure==="attendance")throw Error("PRIVATE_ATTENDANCE_DB_PASSWORD");
    return {college:{id:"11111111-1111-4111-8111-111111111111"},
      policy:{eligibilityThresholdPercent:75,correctionWindowHours:48},maxCorrectionHours:72};
  },
}));
function visible(node:unknown):string[]{
  if(node==null||typeof node==="boolean")return [];
  if(typeof node==="number"||typeof node==="string")return [String(node)];
  if(Array.isArray(node))return node.flatMap(visible);
  if(!isValidElement(node))return [];
  const props=node.props as Record<string,unknown>;
  return ["children","title","description","href","action","eyebrow"].flatMap(key=>visible(props[key]));
}
const render=(query:Record<string,string|string[]|undefined>={})=>
  SuperAdminSettingsPage({searchParams:Promise.resolve(query)});
beforeEach(()=>{
  state.role="ADMIN";state.selected=true;state.failure="";
  state.platformReads=0;state.editorReads=0;state.attendanceReads=0;
});
describe("Super Admin last-third Tenant Settings: safe scope and dependency failures",()=>{
  it("UX-admin-settings-22 disabled/college-only roles cannot fetch global inventory or editor controls",async()=>{
    for(const role of ["COLLEGE","DISABLED"] as const){
      state.role=role;
      const page=visible(await render()).join(" ");
      expect(page).toContain("Tenant settings access denied");
      expect(page).toContain("Back to dashboard");
      expect(page).not.toContain("IIT Dharwad");
    }
    expect(state.platformReads).toBe(0);
    expect(state.editorReads).toBe(0);
    expect(state.attendanceReads).toBe(0);
  });
  it("UX-admin-settings-23 forged/repeated GET selectors fail before any policy read",async()=>{
    const page=visible(await render({section:["sms","placements"]})).join(" ");
    expect(page).toContain("Invalid setting filter");
    expect(state.platformReads).toBe(0);
  });
  it("UX-admin-settings-24 primary inventory failure offers safe retry with exact filters",async()=>{
    state.failure="platform";
    const page=visible(await render({q:"IIT Dharwad",section:"attendance"})).join(" ");
    expect(page).toContain("Tenant settings unavailable");
    expect(page).toContain("Retry loading settings");
    expect(page).toContain("q=IIT+Dharwad");
    expect(page).toContain("section=attendance");
    expect(page).not.toContain("PRIVATE_PLATFORM_DB_PASSWORD");
  });
  it("UX-admin-settings-25 editor failure cannot hide effective settings inventory",async()=>{
    state.failure="editor";
    const page=visible(await render()).join(" ");
    expect(page).toContain("Tenant Settings");
    expect(page).toContain("Tenant settings editor is temporarily unavailable.");
    expect(page).not.toContain("Tenant settings unavailable");
    expect(page).not.toContain("PRIVATE_SETTINGS_DB_PASSWORD");
    expect(state.platformReads).toBe(1);
    expect(state.attendanceReads).toBe(1);
  });
  it("UX-admin-settings-26 attendance service failure cannot blank tenant settings",async()=>{
    state.failure="attendance";
    const page=visible(await render()).join(" ");
    expect(page).toContain("Attendance policy is temporarily unavailable.");
    expect(page).toContain("Tenant Settings");
    expect(page).not.toContain("PRIVATE_ATTENDANCE_DB_PASSWORD");
    expect(state.editorReads).toBe(1);
  });
});
