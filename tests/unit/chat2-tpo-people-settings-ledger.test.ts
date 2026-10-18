import {describe,expect,it} from "vitest";
import {
 buildTpoTeamRoster,summarizeTpoTeam,buildTpoTrustedCompanies,buildTpoTrustedDomains,
 tpoSettingsCollegeIdSchema,TPO_TEAM_ROLE_LABELS,
 type TpoTeamEvidenceRow,
} from "@/modules/placements/tpo-settings-read-model";
import {sortTpoPeople} from "@/modules/placements/tpo-team-people-sort-model";
import {tpoCommunicationChangeSchema,tpoCommunicationChanges,tpoCommunicationUpdateAlreadyApplied} from "@/modules/placements/tpo-communication-change-model";

const college="00000000-0000-4000-8000-000000000001";
const date=(iso:string)=>new Date(iso);
const member=(membershipId:string,displayName:string,role:TpoTeamEvidenceRow["role"]):TpoTeamEvidenceRow=>({
 membershipId,displayName,membershipStatus:"ACTIVE",platformStatus:"ACTIVE",role,
});

describe("TPO people and trusted-company service read models",()=>{
 it("TPO-settings-audit-55 rejects forged college selection and impossible admin roles",()=>{
  expect(tpoSettingsCollegeIdSchema.safeParse(college).success).toBe(true);
  for(const attempted of ["", "other-college","../admin",college+"?unsafe=1",null])
   expect(tpoSettingsCollegeIdSchema.safeParse(attempted).success).toBe(false);
  expect(TPO_TEAM_ROLE_LABELS.TPO_ADMIN).toBe("TPO Admin assignment");
  expect(TPO_TEAM_ROLE_LABELS.FACULTY_COORDINATOR).toBe("Faculty Coordinator");
 });
 it("TPO-settings-audit-55 deduplicates college roles, excludes disabled members and counts only dated coordinator duties",()=>{
  const evidence:TpoTeamEvidenceRow[]=[
   member("a","Ada","TPO"),
   member("a","Ada","TPO_ADMIN"),
   member("a","Ada","TPO"),
   member("b","Bob","FACULTY_COORDINATOR"),
   {...member("c","Cara","STUDENT_COORDINATOR"),jobId:"job-1",jobTitle:"Drive 1",onDate:"2099-07-04"},
   {...member("c","Cara","STUDENT_COORDINATOR"),jobId:"job-1",jobTitle:"Drive 1",onDate:"2099-07-04"},
   {...member("c","Cara","STUDENT_COORDINATOR"),jobId:"job-1",jobTitle:"Drive 1",onDate:"2099-07-05"},
   {...member("d","Disabled","TPO_ADMIN"),platformStatus:"DISABLED"},
   {...member("e","Suspended","TPO"),membershipStatus:"SUSPENDED"},
  ];
  const before=JSON.stringify(evidence);
  const roster=buildTpoTeamRoster(evidence);
  expect(JSON.stringify(evidence)).toBe(before);
  expect(roster.map(item=>item.displayName)).toEqual(["Ada","Bob","Cara"]);
  expect(roster[0]?.roles).toEqual(["TPO_ADMIN","TPO"]);
  expect(roster[2]?.studentDuties.map(item=>item.onDate)).toEqual(["2099-07-05","2099-07-04"]);
  expect(summarizeTpoTeam(roster)).toEqual({
   total:3,tpoMemberships:1,tpoAdmins:1,facultyCoordinators:1,studentCoordinators:1,studentDutyAssignments:2,
  });
 });
 it("TPO-settings-audit-55 sorts people by persisted work without mutating caller rows",()=>{
  const members=[
   {membershipId:"a",displayName:"Ada",studentDuties:[],overdueAsks:1,liveDrives:0,companies:0},
   {membershipId:"b",displayName:"Bob",studentDuties:[{}],overdueAsks:0,liveDrives:3,companies:0},
  ];
  expect(sortTpoPeople(members,"WORK").map(row=>row.membershipId)).toEqual(["b","a"]);
  expect(sortTpoPeople(members,"OVERDUE").map(row=>row.membershipId)).toEqual(["a","b"]);
  expect(sortTpoPeople(members,"NAME").map(row=>row.membershipId)).toEqual(["a","b"]);
  expect(members.map(row=>row.membershipId)).toEqual(["a","b"]);
 });
 it("TPO-settings-audit-55 never treats company domain metadata as a trusted-domain allowlist",()=>{
  const companies=[
   {companyId:"b",relationshipId:"rel-b",name:"Zebra",primaryDomain:"zebra.example",isTrusted:false},
   {companyId:"a",relationshipId:"rel-a",name:"Alpha",primaryDomain:"alpha.example",isTrusted:true},
  ];
  const view=buildTpoTrustedCompanies(companies);
  expect(view).toMatchObject({total:2,trusted:1,notTrusted:1});
  expect(view.companies.map(row=>row.name)).toEqual(["Alpha","Zebra"]);
  expect(companies[0]?.name).toBe("Zebra");
  expect(buildTpoTrustedDomains([])).toEqual([]);
  const domains=buildTpoTrustedDomains([
   {domain:" RECRUIT.EXAMPLE ",createdAt:date("2099-07-04T00:00:00.000Z")},
   {domain:"recruit.example",createdAt:date("2099-07-01T00:00:00.000Z")},
   {domain:"other.example",createdAt:date("2099-07-03T00:00:00.000Z")},
   {domain:"  ",createdAt:date("2099-07-04T00:00:00.000Z")},
  ]);
  expect(domains.map(row=>row.domain)).toEqual(["other.example","recruit.example"]);
  expect(domains[1]?.createdAt.toISOString()).toBe("2099-07-01T00:00:00.000Z");
 });
});

describe("TPO campaign/settings people write resilience",()=>{
 it("TPO-campaigns-public-12 requires a section-bound version token and rejects cross-section writes",()=>{
  const good={
   section:"SMS_CAP",smsMonthlyCap:500,expectedVersion:null,
  } as const;
  expect(tpoCommunicationChangeSchema.safeParse(good).success).toBe(true);
  for(const input of [
   {...good,smsMonthlyCap:-1},{...good,smsMonthlyCap:100001},
   {...good,smsMonthlyCap:1.5},{...good,expectedVersion:"yesterday"},
   {...good,collegeId:college},{...good,notifyPrepAssigned:false},
   {section:"RECRUITER_DURATION",recruiterAccessMonths:5,expectedVersion:null},
   {section:"SIGNATURE",emailSignature:"x".repeat(301),expectedVersion:null},
   {section:"PREP_THRESHOLD",prepThresholdPct:101,expectedVersion:null},
   {section:"OPTIONAL_EMAILS",notifyDriveOpenEmail:true,expectedVersion:null},
  ])expect(tpoCommunicationChangeSchema.safeParse(input).success,JSON.stringify(input)).toBe(false);
 });
 it("TPO-campaigns-public-12 compares section-only changes before no-op retries",()=>{
  const cmd=tpoCommunicationChangeSchema.parse({section:"SIGNATURE",emailSignature:"  Careers Office  ",expectedVersion:null});
  const changed=tpoCommunicationChanges(cmd);
  expect(changed).toEqual({emailSignature:"Careers Office"});
  expect(tpoCommunicationUpdateAlreadyApplied({emailSignature:"Careers Office",smsMonthlyCap:200},changed)).toBe(true);
  expect(tpoCommunicationUpdateAlreadyApplied({emailSignature:"Different",smsMonthlyCap:200},changed)).toBe(false);
  const emails=tpoCommunicationChangeSchema.parse({section:"OPTIONAL_EMAILS",
   notifyDriveOpenEmail:false,notifyResultApplied:true,notifyNudges:false,notifyPrepAssigned:true,expectedVersion:null});
  expect(tpoCommunicationChanges(emails)).toEqual({
   notifyDriveOpenEmail:false,notifyResultApplied:true,notifyNudges:false,notifyPrepAssigned:true,
  });
 });
});
