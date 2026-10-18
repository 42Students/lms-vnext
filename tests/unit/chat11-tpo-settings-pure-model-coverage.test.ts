import {describe,expect,it} from "vitest";
import {
 orderTpoSettingsSeasons,summarizeTpoSettingsSeasons,tpoSettingOrigin,
 formatTpoEligibilityThreshold,parseTpoRulesPageParams,
} from "@/modules/placements/tpo-settings-model";
import {
 parseTpoMyNotificationsParams,resolveTpoNotificationPreferences,
 safeTpoNotificationLabel,tpoNotificationReadStatus,tpoMyNotificationsHref,
 TPO_NOTIFICATION_PREFERENCE_DEFAULTS,
} from "@/modules/placements/tpo-my-notifications-model";
import {
 buildTpoTeamRoster,summarizeTpoTeam,buildTpoTrustedCompanies,
 buildTpoTrustedDomains,
} from "@/modules/placements/tpo-settings-read-model";

const at=(value:string)=>new Date(value);
describe("chat-11 TPO settings and college setup pure functions",()=>{
 it("TPO-SETTINGS-MODEL-01 orders active seasons first without mutating source and counts status",()=>{
  const seasons=[
   {id:"c",name:"old",code:"OLD",startDate:"2098-01-01",endDate:"2098-09-30",status:"CLOSED",closedAt:at("2098-10-01T00:00:00Z")},
   {id:"a",name:"new",code:"NEW",startDate:"2099-01-01",endDate:"2099-09-30",status:"ACTIVE",closedAt:null},
   {id:"b",name:"later",code:"NEW2",startDate:"2099-06-01",endDate:"2099-12-01",status:"ACTIVE",closedAt:null},
  ];
  const sorted=orderTpoSettingsSeasons(seasons);
  expect(sorted.map(row=>row.id)).toEqual(["b","a","c"]);
  expect(seasons.map(row=>row.id)).toEqual(["c","a","b"]);
  expect(summarizeTpoSettingsSeasons(seasons)).toEqual({total:3,active:2,closed:1});
  expect(summarizeTpoSettingsSeasons([])).toEqual({total:0,active:0,closed:0});
 });
 it("TPO-SETTINGS-MODEL-02 differentiates source defaults and stored eligibility thresholds",()=>{
  expect(tpoSettingOrigin(null)).toBe("SOURCE_DEFAULT");
  expect(tpoSettingOrigin(undefined)).toBe("SOURCE_DEFAULT");
  expect(tpoSettingOrigin(at("2099-01-01T00:00:00Z"))).toBe("PERSISTED");
  expect(formatTpoEligibilityThreshold(null)).toBe("No minimum");
  expect(formatTpoEligibilityThreshold(760)).toBe("7.60");
  expect(formatTpoEligibilityThreshold(0)).toBe("0.00");
 });
 it("TPO-SETTINGS-MODEL-03 rejects forged, repeated and nondecimal rules URL pagination",()=>{
  expect(parseTpoRulesPageParams({})).toBe(1);
  expect(parseTpoRulesPageParams({page:"10000"})).toBe(10000);
  for(const raw of [
   {page:"0"},{page:"10001"},{page:"2e2"},{page:"0x10"},
   {page:"1 "},{page:"01"},{page:"-1"},
   {page:["1","2"]},{page:"2",collegeId:"foreign"},
  ])expect(parseTpoRulesPageParams(raw)).toBeNull();
 });
 it("TPO-SETTINGS-NOTICES-04 validates strict notification filters and canonical navigation",()=>{
  expect(parseTpoMyNotificationsParams({})).toEqual({view:"ALL",page:1,pageSize:25});
  expect(parseTpoMyNotificationsParams({view:"UNREAD",page:"7",pageSize:"50"}))
   .toEqual({view:"UNREAD",page:7,pageSize:50});
  for(const raw of [
   {page:["1","2"]},{view:"EVERYONE"},{page:"-1"},{page:"2e3"},
   {pageSize:"101"},{view:"READ",userId:"other"},
  ])expect(parseTpoMyNotificationsParams(raw)).toBeNull();
  expect(tpoMyNotificationsHref({view:"ALL",page:1,pageSize:25}))
   .toBe("/tpo/settings/notifications");
  const url=new URL(tpoMyNotificationsHref({view:"READ",page:2,pageSize:50}),"https://example.org");
  expect(url.searchParams.get("view")).toBe("READ");
  expect(url.searchParams.get("page")).toBe("2");
  expect(url.searchParams.get("pageSize")).toBe("50");
 });
 it("TPO-SETTINGS-NOTICES-05 never assumes preferences exist when storage is absent",()=>{
  expect(resolveTpoNotificationPreferences(false,null))
   .toEqual({source:"UNAVAILABLE",values:null});
  const source=resolveTpoNotificationPreferences(true,null);
  expect(source.source).toBe("SOURCE_DEFAULT");
  expect(source.values).toEqual(TPO_NOTIFICATION_PREFERENCE_DEFAULTS);
  expect(source.values).not.toBe(TPO_NOTIFICATION_PREFERENCE_DEFAULTS);
  const saved={...TPO_NOTIFICATION_PREFERENCE_DEFAULTS,morningDigest:true};
  const persisted=resolveTpoNotificationPreferences(true,saved);
  expect(persisted.source).toBe("PERSISTED");
  expect(persisted.values).toEqual(saved);
  expect(persisted.values).not.toBe(saved);
 });
 it("TPO-SETTINGS-NOTICES-06 returns fixed safe labels and correct read state only",()=>{
  expect(safeTpoNotificationLabel("PLACEMENTS")).toBe("Placement update");
  expect(safeTpoNotificationLabel("COURSES")).toBe("Course update");
  expect(safeTpoNotificationLabel("<script>evil()</script>")).toBe("College notification");
  expect(tpoNotificationReadStatus(null)).toBe("UNREAD");
  expect(tpoNotificationReadStatus(at("2099-01-01T00:00:00Z"))).toBe("READ");
 });
 it("TPO-SETTINGS-TEAM-07 merges only active verified team assignments and deduplicates dated duties",()=>{
  const seed=[
   {membershipId:"a",displayName:"Officer",membershipStatus:"ACTIVE",platformStatus:"ACTIVE",role:"TPO" as const},
   {membershipId:"a",displayName:"Officer",membershipStatus:"ACTIVE",platformStatus:"ACTIVE",role:"TPO_ADMIN" as const},
   {membershipId:"b",displayName:"Student",membershipStatus:"ACTIVE",platformStatus:"ACTIVE",role:"STUDENT_COORDINATOR" as const,
    jobId:"job-1",jobTitle:"Drive",onDate:"2099-08-01"},
   {membershipId:"b",displayName:"Student",membershipStatus:"ACTIVE",platformStatus:"ACTIVE",role:"STUDENT_COORDINATOR" as const,
    jobId:"job-1",jobTitle:"Drive",onDate:"2099-08-01"},
   {membershipId:"x",displayName:"Disabled",membershipStatus:"SUSPENDED",platformStatus:"ACTIVE",role:"COLLEGE_ADMIN" as const},
   {membershipId:"y",displayName:"Disabled user",membershipStatus:"ACTIVE",platformStatus:"DISABLED",role:"TPO" as const},
  ];
  const team=buildTpoTeamRoster(seed);
  expect(team.map(row=>row.membershipId)).toEqual(["a","b"]);
  expect(team[0]?.roles).toEqual(["TPO_ADMIN","TPO"]);
  expect(team[1]?.studentDuties).toHaveLength(1);
  expect(summarizeTpoTeam(team)).toEqual({
   total:2,tpoMemberships:1,tpoAdmins:1,facultyCoordinators:0,
   studentCoordinators:1,studentDutyAssignments:1,
  });
 });
 it("TPO-SETTINGS-COMPANY-08 sorts trust facts but never treats company domain as trust",()=>{
  const source=[
   {companyId:"z",relationshipId:"rz",name:"Zulu",primaryDomain:"z.example",isTrusted:false},
   {companyId:"a",relationshipId:"ra",name:"Alpha",primaryDomain:"a.example",isTrusted:true},
  ];
  expect(buildTpoTrustedCompanies(source)).toEqual({
   companies:[source[1],source[0]],total:2,trusted:1,notTrusted:1,
  });
  const domains=buildTpoTrustedDomains([
   {domain:" Careers.Example ",createdAt:at("2099-04-04T00:00:00Z")},
   {domain:"careers.example",createdAt:at("2099-01-01T00:00:00Z")},
   {domain:"jobs.example",createdAt:at("2099-02-01T00:00:00Z")},
   {domain:" ",createdAt:at("2099-01-01T00:00:00Z")},
  ]);
  expect(domains.map(row=>row.domain)).toEqual(["careers.example","jobs.example"]);
  expect(domains[0]?.createdAt).toEqual(at("2099-01-01T00:00:00Z"));
 });
});
