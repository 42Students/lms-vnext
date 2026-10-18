import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {
 buildTpoTeamRoster,summarizeTpoTeam,buildTpoTrustedCompanies,
 buildTpoTrustedDomains,tpoSettingsCollegeIdSchema,
} from "@/modules/placements/tpo-settings-read-model";

const a="11111111-1111-4111-8111-111111111111";
const b="22222222-2222-4222-8222-222222222222";
const c="33333333-3333-4333-8333-333333333333";

describe("TPO-settings-audit-PEOPLE-01 persisted placement-team evidence",()=>{
 it("deduplicates TPO administrative roles, excludes expired users and dated duplicate duties",()=>{
  const valid={membershipStatus:"ACTIVE",platformStatus:"ACTIVE"} as const;
  const entries=[
   {...valid,membershipId:a,displayName:"Asha",role:"TPO" as const},
   {...valid,membershipId:a,displayName:"Asha",role:"TPO_ADMIN" as const},
   {...valid,membershipId:a,displayName:"Asha",role:"TPO_ADMIN" as const},
   {...valid,membershipId:b,displayName:"Bala",role:"STUDENT_COORDINATOR" as const,
    jobId:"drive-1",jobTitle:"Drive Alpha",onDate:"2026-10-18"},
   {...valid,membershipId:b,displayName:"Bala",role:"STUDENT_COORDINATOR" as const,
    jobId:"drive-1",jobTitle:"Drive Alpha",onDate:"2026-10-18"},
   {...valid,membershipId:b,displayName:"Bala",role:"STUDENT_COORDINATOR" as const,
    jobId:"drive-2",jobTitle:"Drive Beta",onDate:"2026-10-17"},
   {...valid,membershipId:c,displayName:"Suspended",role:"FACULTY_COORDINATOR" as const,
    membershipStatus:"SUSPENDED"},
   {...valid,membershipId:c,displayName:"Disabled",role:"TPO" as const,platformStatus:"DISABLED"},
  ];
  const members=buildTpoTeamRoster(entries);
  expect(members).toHaveLength(2);
  expect(members.map(m=>m.displayName)).toEqual(["Asha","Bala"]);
  expect(members[0]?.roles).toEqual(["TPO_ADMIN","TPO"]);
  expect(members[1]?.roles).toEqual(["STUDENT_COORDINATOR"]);
  expect(members[1]?.studentDuties.map(x=>x.jobId)).toEqual(["drive-1","drive-2"]);
  expect(summarizeTpoTeam(members)).toEqual({
   total:2,tpoMemberships:1,tpoAdmins:1,facultyCoordinators:0,
   studentCoordinators:1,studentDutyAssignments:2,
  });
 });
 it("does not invent faculty coordinators from ordinary Faculty memberships",()=>{
  expect(buildTpoTeamRoster([{
   membershipId:a,displayName:"Teacher",membershipStatus:"ACTIVE",
   platformStatus:"ACTIVE",role:"COLLEGE_ADMIN",
  }])[0]?.roles).toEqual(["COLLEGE_ADMIN"]);
  expect(buildTpoTeamRoster([{
   membershipId:a,displayName:null,membershipStatus:"ACTIVE",
   platformStatus:"ACTIVE",role:"TPO",
  }])[0]?.displayName).toBe("Unnamed member");
 });
 it("requires a valid college UUID before any team or trust data access",()=>{
  expect(tpoSettingsCollegeIdSchema.safeParse(a).success).toBe(true);
  for(const value of ["../foreign","",0,"other-college",a+"-extra"]){
   expect(tpoSettingsCollegeIdSchema.safeParse(value).success).toBe(false);
  }
  const service=readFileSync("src/modules/placements/tpo-settings-people-service.ts","utf8");
  expect(service).toContain("context.membership?.collegeId !== collegeId");
  expect(service).toContain("requirePlacementManageScope(context, collegeId)");
  expect(service).toContain('eq(collegeMemberships.collegeId, collegeId)');
  expect(service).toContain('eq(placementTpoTrustedDomains.collegeId, collegeId)');
  expect(service).toContain("hasPlacementTeamMembership(context)");
 });
});

describe("TPO-settings-audit-TRUST-01 explicit employer trust is college-local",()=>{
 it("counts persisted company trust without treating global company domains as approved",()=>{
  const rows=[
   {companyId:"c2",relationshipId:"r2",name:"Zephyr",primaryDomain:"zephyr.example",isTrusted:false},
   {companyId:"c1",relationshipId:"r1",name:"Acme",primaryDomain:"acme.example",isTrusted:true},
  ];
  const result=buildTpoTrustedCompanies(rows);
  expect(result).toMatchObject({total:2,trusted:1,notTrusted:1});
  expect(result.companies.map(c=>c.name)).toEqual(["Acme","Zephyr"]);
  expect(buildTpoTrustedDomains([])).toEqual([]);
  // A company-provided primary domain is not in the explicit allowlist.
  expect(buildTpoTrustedDomains([]).some(row=>row.domain==="acme.example")).toBe(false);
 });
 it("normalizes and deduplicates explicit trusted domains by earliest persisted record",()=>{
  const old=new Date("2026-10-01T00:00:00Z"),newer=new Date("2026-10-02T00:00:00Z");
  const list=buildTpoTrustedDomains([
   {domain:" B.EXAMPLE ",createdAt:newer},
   {domain:"a.example",createdAt:newer},
   {domain:"b.example",createdAt:old},
   {domain:"   ",createdAt:old},
  ]);
  expect(list.map(row=>row.domain)).toEqual(["a.example","b.example"]);
  expect(list[1]?.createdAt).toEqual(old);
 });
});
