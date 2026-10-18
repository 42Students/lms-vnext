import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {
 buildTpoTeamRoster,summarizeTpoTeam,buildTpoTrustedCompanies,
 buildTpoTrustedDomains,TPO_TEAM_ROLE_LABELS,tpoSettingsCollegeIdSchema,
 type TpoTeamEvidenceRow,
} from "@/modules/placements/tpo-settings-read-model";
import {tpoPublicJoinLinkChangeSchema,tpoPublicJoinLinkToggleSchema,publicJoinLinkPath}
 from "@/modules/placements/tpo-public-join-link-model";

const college="00000000-0000-4000-8000-000000000001",other="00000000-0000-4000-8000-000000000002";
const person=(patch:Partial<TpoTeamEvidenceRow>):TpoTeamEvidenceRow=>({
 membershipId:college,displayName:"Ada",membershipStatus:"ACTIVE",
 platformStatus:"ACTIVE",role:"TPO",...patch,
});

describe("TPO-BREAK-settings-people-01 tenant and evidence-based team permissions",()=>{
 it("excludes deactivated users and removed memberships, even when role evidence remains",()=>{
  const roster=buildTpoTeamRoster([
   person({membershipId:college,role:"TPO"}),
   person({membershipId:other,role:"COLLEGE_ADMIN",membershipStatus:"INACTIVE"}),
   person({membershipId:"third",role:"TPO_ADMIN",platformStatus:"SUSPENDED"}),
  ]);
  expect(roster).toHaveLength(1);
  expect(roster[0]?.membershipId).toBe(college);
  expect(summarizeTpoTeam(roster)).toMatchObject({total:1,tpoMemberships:1,tpoAdmins:0});
 });
 it("deduplicates explicitly assigned roles and date-bound student coordinator duties",()=>{
  const roster=buildTpoTeamRoster([
   person({role:"TPO"}),
   person({role:"TPO_ADMIN"}),
   person({role:"TPO_ADMIN"}),
   person({membershipId:other,role:"STUDENT_COORDINATOR",displayName:"Bob",
    jobId:"job-a",jobTitle:"Dev",onDate:"2026-10-20"}),
   person({membershipId:other,role:"STUDENT_COORDINATOR",displayName:"Bob",
    jobId:"job-a",jobTitle:"Dev",onDate:"2026-10-20"}),
   person({membershipId:other,role:"STUDENT_COORDINATOR",displayName:"Bob",
    jobId:"job-b",jobTitle:"Ops",onDate:"2026-10-21"}),
  ]);
  expect(roster).toHaveLength(2);
  const ada=roster.find(row=>row.membershipId===college)!;
  const bob=roster.find(row=>row.membershipId===other)!;
  expect(ada.roles).toEqual(["TPO_ADMIN","TPO"]);
  expect(bob.studentDuties).toEqual([
   {jobId:"job-b",jobTitle:"Ops",onDate:"2026-10-21"},
   {jobId:"job-a",jobTitle:"Dev",onDate:"2026-10-20"},
  ]);
  expect(summarizeTpoTeam(roster).studentDutyAssignments).toBe(2);
  expect(TPO_TEAM_ROLE_LABELS.FACULTY_COORDINATOR).toBe("Faculty Coordinator");
 });
 it("never promotes plain faculty or learner evidence into coordinator permissions",()=>{
  const rows=buildTpoTeamRoster([person({role:"COLLEGE_ADMIN"}),person({role:"TPO"})]);
  expect(summarizeTpoTeam(rows).facultyCoordinators).toBe(0);
  expect(summarizeTpoTeam(rows).studentCoordinators).toBe(0);
 });
 it("trusted-company reporting uses scoped persisted trusted flag, not a domain heuristic",()=>{
  const source=[
   {companyId:college,relationshipId:"rel-a",name:"Alpha",primaryDomain:"alpha.test",isTrusted:false},
   {companyId:other,relationshipId:"rel-b",name:"Beta",primaryDomain:"beta.test",isTrusted:true},
  ];
  const out=buildTpoTrustedCompanies(source);
  expect(out).toMatchObject({total:2,trusted:1,notTrusted:1});
  expect(out.companies[0]?.isTrusted).toBe(false);
  expect(source[0]?.isTrusted).toBe(false);
 });
 it("deduplicates explicit allowlisted domains and keeps oldest audit timestamp",()=>{
  const earliest=new Date("2026-10-01T00:00:00Z");
  const later=new Date("2026-10-02T00:00:00Z");
  const rows=buildTpoTrustedDomains([
   {domain:" EXAMPLE.TEST ",createdAt:later},
   {domain:"example.test",createdAt:earliest},
   {domain:"",createdAt:later},
   {domain:"another.test",createdAt:later},
  ]);
  expect(rows).toEqual([
   {domain:"another.test",createdAt:later},
   {domain:"example.test",createdAt:earliest},
  ]);
 });
 it("TPO-settings-audit-55 never mutates an unversioned legacy link or recycles a stale copied secret",()=>{
  const ui=readFileSync("src/components/tpo/tpo-public-join-link-card.tsx","utf8");
  expect(ui).toContain('action==="REPLACE"&&!status.link?.id');
  expect(ui).toContain('if(!status.link.id)');
  expect(ui).toContain('setFreshUrl("");');
  expect(ui).toContain("actionInFlight.current=true");
  expect(ui).toContain("actionInFlight.current=false");
  expect(ui).toContain("Refresh the join link status and try again.");
 });
 it("strictly validates college UUIDs, confirmed link rotation and company scope",()=>{
  expect(tpoSettingsCollegeIdSchema.safeParse(college).success).toBe(true);
  for(const value of ["", "other-tenant", "not-a-uuid"])
   expect(tpoSettingsCollegeIdSchema.safeParse(value).success).toBe(false);
  const company={scope:"COMPANY",action:"REPLACE",companyId:other,confirmed:true,expectedLinkId:college};
  expect(tpoPublicJoinLinkChangeSchema.safeParse(company).success).toBe(true);
  for(const patch of [{confirmed:false},{companyId:"not-a-uuid"},{scope:"COLLEGE"},
   {unexpectedTenant:college},{expectedLinkId:"not-a-uuid"}])
   expect(tpoPublicJoinLinkChangeSchema.safeParse({...company,...patch}).success).toBe(false);
  expect(tpoPublicJoinLinkToggleSchema.safeParse({scope:"COMPANY",companyId:other,enabled:false}).success).toBe(false);
  expect(tpoPublicJoinLinkToggleSchema.safeParse({scope:"COMPANY",companyId:other,expectedLinkId:college,enabled:false}).success).toBe(true);
  expect(tpoPublicJoinLinkToggleSchema.safeParse({scope:"COMPANY",enabled:false}).success).toBe(false);
  expect(publicJoinLinkPath("COMPANY","hello/world")).toBe("/company-join/hello%2Fworld");
 });
});
