import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
const state=vi.hoisted(()=>({
 context:vi.fn(),redirect:vi.fn(),workspace:vi.fn(),details:vi.fn(),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:state.context}));
vi.mock("next/navigation",()=>({redirect:state.redirect}));
vi.mock("@/modules/placements/report-service",()=>({
 getPlacementReportWorkspace:state.workspace,
 getPlacementReportDetails:state.details,
}));
import BranchPage from "@/app/(authenticated)/tpo/reports/by-branch/page";
import CtcPage from "@/app/(authenticated)/tpo/reports/ctc/page";

const id="00000000-0000-4000-8000-000000000001";
const ctx=(role:"TPO"|"COLLEGE_ADMIN"|"LEARNER"="TPO"):RequestContext=>({
 user:{id:"staff",identityUid:"staff-uid",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"m",collegeId:id,organizationId:"org-a",status:"ACTIVE",roles:[role]},
});
beforeEach(()=>{
 vi.clearAllMocks();
 state.context.mockResolvedValue(ctx());
 state.redirect.mockImplementation(()=>{throw new Error("REDIRECT_TO_DASHBOARD")});
 state.workspace.mockResolvedValue({
  noSeason:true,report:{byBranch:[],metrics:{}},registrationScopeNote:"Current college",
 });
});

describe("UX-tpo-LAST-THIRD-01 branch and CTC reports server-page guard and state",()=>{
 it("UX-tpo-LAST-THIRD-01 rejects ambiguous branch-report selectors without making any report-service call",async()=>{
  const page=await BranchPage({searchParams:Promise.resolve({
   seasonId:[id,id],jobId:id,
  })});
  expect(page).toMatchObject({props:{path:"/tpo/reports/by-branch"}});
  expect(state.workspace).not.toHaveBeenCalled();
 });
 it("UX-tpo-LAST-THIRD-01 rejects ambiguous compensation selectors without making any report-service call",async()=>{
  const page=await CtcPage({searchParams:Promise.resolve({jobId:["one","two"]})});
  expect(page).toMatchObject({props:{path:"/tpo/reports/ctc"}});
  expect(state.details).not.toHaveBeenCalled();
 });
 it("UX-tpo-LAST-THIRD-01 denies learners, college admins and missing membership before querying branch metrics",async()=>{
  for(const identity of [ctx("LEARNER"),ctx("COLLEGE_ADMIN"),{...ctx(),membership:null}]){
   state.context.mockResolvedValueOnce(identity);
   await expect(BranchPage({searchParams:Promise.resolve({})}))
    .rejects.toThrow("REDIRECT_TO_DASHBOARD");
  }
  expect(state.workspace).not.toHaveBeenCalled();
 });
 it("UX-tpo-LAST-THIRD-01 denies learners before querying private CTC values",async()=>{
  state.context.mockResolvedValueOnce(ctx("LEARNER"));
  await expect(CtcPage({searchParams:Promise.resolve({})}))
   .rejects.toThrow("REDIRECT_TO_DASHBOARD");
  expect(state.details).not.toHaveBeenCalled();
 });
 it("UX-tpo-LAST-THIRD-01 passes trusted college and filters to branch report, and retains honest no-season empty",async()=>{
  const page=await BranchPage({searchParams:Promise.resolve({seasonId:id,jobId:id})});
  expect(state.workspace).toHaveBeenCalledWith(expect.objectContaining({
   membership:expect.objectContaining({collegeId:id}),
  }),{
   collegeId:id,seasonId:id,jobId:id,
  });
  expect(JSON.stringify(page)).toContain("No placement season available");
  expect(JSON.stringify(page)).not.toContain("0 placed");
 });
});
