import {describe,expect,it} from "vitest";
import {tpoSettingsCollegeIdSchema,buildTpoTeamRoster,summarizeTpoTeam,buildTpoTrustedCompanies,buildTpoTrustedDomains,TPO_TEAM_ROLE_LABELS} from "@/modules/placements/tpo-settings-read-model";
import {tpoPublicJoinLinkChangeSchema,tpoPublicJoinLinkToggleSchema,publicJoinLinkPath,PUBLIC_JOIN_LINK_COPY} from "@/modules/placements/tpo-public-join-link-model";
import {tpoCommunicationChangeSchema,tpoCommunicationChanges,tpoCommunicationUpdateAlreadyApplied} from "@/modules/placements/tpo-communication-change-model";
const id=(n:number)=>"00000000-0000-4000-8000-"+String(n).padStart(12,"0");

describe("TPO-settings-audit-55 settings people, public recruiter links and CAS write semantics",()=>{
 it("requires a UUID before choosing the tenant for people or trusted companies",()=>{
  expect(tpoSettingsCollegeIdSchema.safeParse(id(1)).success).toBe(true);
  for(const input of ["../college", "", "company", id(1)+"?collegeId="+id(2)])
   expect(tpoSettingsCollegeIdSchema.safeParse(input).success).toBe(false);
 });
 it("team roster counts only active persisted roles, never infers faculty/learner coordination",()=>{
  const evidence=[
   {membershipId:id(1),displayName:"Ada",membershipStatus:"ACTIVE",platformStatus:"ACTIVE",role:"TPO" as const},
   {membershipId:id(1),displayName:"Ada",membershipStatus:"ACTIVE",platformStatus:"ACTIVE",role:"TPO_ADMIN" as const},
   {membershipId:id(2),displayName:"Bob",membershipStatus:"ACTIVE",platformStatus:"ACTIVE",role:"STUDENT_COORDINATOR" as const,
    jobId:id(9),jobTitle:"Drive 1",onDate:"2099-01-01"},
   {membershipId:id(2),displayName:"Bob",membershipStatus:"ACTIVE",platformStatus:"ACTIVE",role:"STUDENT_COORDINATOR" as const,
    jobId:id(9),jobTitle:"Drive 1",onDate:"2099-01-01"},
   {membershipId:id(3),displayName:"Carol",membershipStatus:"SUSPENDED",platformStatus:"ACTIVE",role:"FACULTY_COORDINATOR" as const},
   {membershipId:id(4),displayName:"Dana",membershipStatus:"ACTIVE",platformStatus:"DISABLED",role:"FACULTY_COORDINATOR" as const},
  ];
  const roster=buildTpoTeamRoster(evidence);
  expect(roster).toHaveLength(2);
  expect(roster[0]?.roles).toEqual(["TPO_ADMIN","TPO"]);
  expect(roster[1]?.studentDuties).toEqual([{jobId:id(9),jobTitle:"Drive 1",onDate:"2099-01-01"}]);
  expect(summarizeTpoTeam(roster)).toMatchObject({total:2,tpoAdmins:1,tpoMemberships:1,facultyCoordinators:0,studentCoordinators:1,studentDutyAssignments:1});
  expect(TPO_TEAM_ROLE_LABELS.FACULTY_COORDINATOR).toBe("Faculty Coordinator");
 });
 it("trusted company list is a stable copy with truthful independent totals",()=>{
  const rows=[
   {companyId:id(2),relationshipId:id(22),name:"Beta",primaryDomain:"beta.example.com",isTrusted:false},
   {companyId:id(1),relationshipId:id(11),name:"Alpha",primaryDomain:null,isTrusted:true},
  ];
  const result=buildTpoTrustedCompanies(rows);
  expect(result.companies.map(x=>x.name)).toEqual(["Alpha","Beta"]);
  expect(rows[0]?.name).toBe("Beta");
  expect(result).toMatchObject({total:2,trusted:1,notTrusted:1});
 });
 it("trusted domains come from explicit rows, normalize case and keep earliest recorded evidence",()=>{
  const rows=[
   {domain:" Example.com ",createdAt:new Date("2099-05-02T00:00:00Z")},
   {domain:"example.COM",createdAt:new Date("2099-05-01T00:00:00Z")},
   {domain:"beta.com",createdAt:new Date("2099-05-03T00:00:00Z")},
   {domain:" ",createdAt:new Date("2099-05-04T00:00:00Z")},
  ];
  const result=buildTpoTrustedDomains(rows);
  expect(result.map(x=>x.domain)).toEqual(["beta.com","example.com"]);
  expect(result[1]?.createdAt.toISOString()).toBe("2099-05-01T00:00:00.000Z");
 });
 it("public join link create/rotate requires explicit consent, scope and observed link identity",()=>{
  const create={scope:"COLLEGE",action:"CREATE",confirmed:true};
  const rotate={scope:"COMPANY",action:"REPLACE",confirmed:true,companyId:id(2),expectedLinkId:id(9)};
  expect(tpoPublicJoinLinkChangeSchema.safeParse(create).success).toBe(true);
  expect(tpoPublicJoinLinkChangeSchema.safeParse(rotate).success).toBe(true);
  for(const invalid of [
   {...create,confirmed:false},{...create,expectedLinkId:id(9)},
   {...rotate,expectedLinkId:undefined},{...rotate,companyId:"fake"},
   {...rotate,collegeId:id(7)}
  ])expect(tpoPublicJoinLinkChangeSchema.safeParse(invalid).success).toBe(false);
 });
 it("public link toggles require an exact observed link ID and never expose token in a status model",()=>{
  expect(tpoPublicJoinLinkToggleSchema.safeParse({scope:"COLLEGE",enabled:false,expectedLinkId:id(1)}).success).toBe(true);
  for(const invalid of [
   {scope:"COLLEGE",enabled:false},
   {scope:"COMPANY",companyId:id(2),enabled:true},
   {scope:"COMPANY",companyId:id(2),enabled:true,expectedLinkId:"latest"},
  ])expect(tpoPublicJoinLinkToggleSchema.safeParse(invalid).success).toBe(false);
  expect(publicJoinLinkPath("COMPANY","a/b")).toBe("/company-join/a%2Fb");
  expect(PUBLIC_JOIN_LINK_COPY.once).toContain("shown only once");
 });
 it("communication changes normalize valid offset versions to the exact UTC CAS token",()=>{
  const raw="2099-01-01T15:30:00+05:30";
  const sections=[
   {section:"SMS_CAP",smsMonthlyCap:250,expectedVersion:raw},
   {section:"SIGNATURE",emailSignature:"Campus recruitment",expectedVersion:raw},
   {section:"OPTIONAL_EMAILS",notifyDriveOpenEmail:true,notifyResultApplied:false,notifyNudges:true,notifyPrepAssigned:false,expectedVersion:raw},
   {section:"PREP_THRESHOLD",prepThresholdPct:75,expectedVersion:raw},
   {section:"RECRUITER_DURATION",recruiterAccessMonths:12,expectedVersion:raw},
  ];
  for(const section of sections){
   const parsed=tpoCommunicationChangeSchema.safeParse(section);
   expect(parsed.success,section.section).toBe(true);
   if(parsed.success)expect(parsed.data.expectedVersion).toBe("2099-01-01T10:00:00.000Z");
  }
 });
 it("communication schemas reject unconfirmed section values or unknown fields",()=>{
  const good={section:"PREP_THRESHOLD",prepThresholdPct:50,expectedVersion:null};
  expect(tpoCommunicationChangeSchema.safeParse(good).success).toBe(true);
  for(const invalid of [
   {...good,prepThresholdPct:101},{...good,prepThresholdPct:25.4},
   {...good,emailSignature:"malformed"},
   {section:"RECRUITER_DURATION",recruiterAccessMonths:18,expectedVersion:null},
   {section:"SMS_CAP",smsMonthlyCap:-1,expectedVersion:null},
  ])expect(tpoCommunicationChangeSchema.safeParse(invalid).success).toBe(false);
 });
 it("only compares the modified section on an idempotent retry, preserving unrelated fields",()=>{
  const change=tpoCommunicationChangeSchema.parse({section:"PREP_THRESHOLD",prepThresholdPct:60,expectedVersion:null});
  const fields=tpoCommunicationChanges(change);
  expect(fields).toEqual({prepThresholdPct:60});
  expect(tpoCommunicationUpdateAlreadyApplied({prepThresholdPct:60,emailSignature:"Other"},fields)).toBe(true);
  expect(tpoCommunicationUpdateAlreadyApplied({prepThresholdPct:75,emailSignature:"Other"},fields)).toBe(false);
 });
});
