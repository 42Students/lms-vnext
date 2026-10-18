import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const state=vi.hoisted(()=>({
 context:vi.fn(),redirect:vi.fn(),team:vi.fn(),trusted:vi.fn(),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:state.context}));
vi.mock("next/navigation",()=>({redirect:state.redirect}));
vi.mock("@/modules/placements/tpo-settings-people-service",()=>({
 getTpoPlacementTeam:state.team,getTpoTrustedCompanies:state.trusted,
}));
import TeamPage from "@/app/(authenticated)/tpo/settings/team/page";
import TrustedPage from "@/app/(authenticated)/tpo/settings/trusted/page";

const college="00000000-0000-4000-8000-000000000001";
const ctx=(roles:readonly ("TPO"|"COLLEGE_ADMIN"|"LEARNER")[]=["TPO"]):RequestContext=>({
 user:{id:"tpo",identityUid:"tpo-uid",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"member",collegeId:college,organizationId:"org-a",status:"ACTIVE",roles},
});
beforeEach(()=>{
 vi.clearAllMocks();
 state.context.mockResolvedValue(ctx());
 state.redirect.mockImplementation(()=>{throw new Error("REDIRECT_DASHBOARD")});
 state.team.mockResolvedValue({
  collegeId:college,members:[],
  summary:{total:0,tpoMemberships:0,tpoAdmins:0,facultyCoordinators:0,
   studentCoordinators:0,studentDutyAssignments:0},
  sources:{tpoMembershipsAvailable:true,teamAssignmentsAvailable:false,studentAssignmentsAvailable:false},
 });
 state.trusted.mockResolvedValue({
  collegeId:college,companies:[],trustedDomains:[],
  explicitDomainsAvailable:false,
  summary:{totalCompanies:0,trustedCompanies:0,notTrustedCompanies:0,trustedDomainCount:null},
 });
});

describe("UX-tpo-LAST-THIRD-01 settings people page server states",()=>{
 it("UX-tpo-LAST-THIRD-01 team page denies non-TPO accounts before staff directory reads",async()=>{
  for(const identity of [ctx(["COLLEGE_ADMIN"]),ctx(["LEARNER"]),{...ctx(),membership:null}]){
   state.context.mockResolvedValueOnce(identity);
   await expect(TeamPage()).rejects.toThrow("REDIRECT_DASHBOARD");
  }
  expect(state.team).not.toHaveBeenCalled();
 });
 it("UX-tpo-LAST-THIRD-01 trusted company page denies non-TPO accounts before reading relationships",async()=>{
  for(const identity of [ctx(["COLLEGE_ADMIN"]),ctx(["LEARNER"]),{...ctx(),membership:null}]){
   state.context.mockResolvedValueOnce(identity);
   await expect(TrustedPage()).rejects.toThrow("REDIRECT_DASHBOARD");
  }
  expect(state.trusted).not.toHaveBeenCalled();
 });
 it("UX-tpo-LAST-THIRD-01 team page does not invent coordinator counts from unavailable tables",async()=>{
  const page=await TeamPage();
  expect(state.team).toHaveBeenCalledWith(expect.objectContaining({
   membership:expect.objectContaining({collegeId:college}),
  }),college);
  const content=JSON.stringify(page);
  expect(content).toContain("Faculty team assignments unavailable");
  expect(content).toContain("Drive Day student-coordinator assignments are unavailable");
  expect(content).toContain("No matching active TPO or coordinator memberships");
  expect(content).toContain("Unavailable");
  expect(content).not.toContain("0 verified coordinators");
 });
 it("UX-tpo-LAST-THIRD-01 trusted page keeps company relationships separate from explicit trusted domain storage",async()=>{
  const page=await TrustedPage();
  expect(state.trusted).toHaveBeenCalledWith(expect.objectContaining({
   membership:expect.objectContaining({collegeId:college}),
  }),college);
  const content=JSON.stringify(page);
  expect(content).toContain("Trusted-domain allowlist unavailable");
  expect(content).toContain("No active placement company relationships");
  expect(content).toContain("Unavailable");
  expect(content).toContain("A company");
  expect(content).not.toContain("All domains are trusted");
 });
});
