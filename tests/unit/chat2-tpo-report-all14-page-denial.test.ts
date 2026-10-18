import {beforeEach,describe,expect,it,vi} from "vitest";
const state=vi.hoisted(()=>({context:vi.fn(),redirect:vi.fn(),getDb:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:state.context}));
vi.mock("next/navigation",()=>({redirect:state.redirect}));
vi.mock("@/db/client",()=>({getDb:state.getDb}));
import Report0 from "@/app/(authenticated)/tpo/reports/by-branch/page";
import Report1 from "@/app/(authenticated)/tpo/reports/by-company/page";
import Report2 from "@/app/(authenticated)/tpo/reports/ctc/page";
import Report3 from "@/app/(authenticated)/tpo/reports/failure-reasons/page";
import Report4 from "@/app/(authenticated)/tpo/reports/intelligence/page";
import Report5 from "@/app/(authenticated)/tpo/reports/joining-followups/page";
import Report6 from "@/app/(authenticated)/tpo/reports/joining-status/page";
import Report7 from "@/app/(authenticated)/tpo/reports/leads/page";
import Report8 from "@/app/(authenticated)/tpo/reports/offers-acceptance/page";
import Report9 from "@/app/(authenticated)/tpo/reports/offers-expiry/page";
import Report10 from "@/app/(authenticated)/tpo/reports/placed-branch/page";
import Report11 from "@/app/(authenticated)/tpo/reports/placement-summary/page";
import Report12 from "@/app/(authenticated)/tpo/reports/season-pipeline/page";
import Report13 from "@/app/(authenticated)/tpo/reports/unplaced/page";

const pages=[
 {name:"by-branch",page:Report0},
 {name:"by-company",page:Report1},
 {name:"ctc",page:Report2},
 {name:"failure-reasons",page:Report3},
 {name:"intelligence",page:Report4},
 {name:"joining-followups",page:Report5},
 {name:"joining-status",page:Report6},
 {name:"leads",page:Report7},
 {name:"offers-acceptance",page:Report8},
 {name:"offers-expiry",page:Report9},
 {name:"placed-branch",page:Report10},
 {name:"placement-summary",page:Report11},
 {name:"season-pipeline",page:Report12},
 {name:"unplaced",page:Report13},
] as const;
const id="00000000-0000-4000-8000-000000000001";
const identity=(role:"TPO"|"COLLEGE_ADMIN"|"LEARNER"="TPO",
 status:"ACTIVE"|"DISABLED"="ACTIVE")=>({
 user:{id:"staff",identityUid:"staff-identity",platformStatus:status,systemRoles:[]},
 membership:{id:"membership",collegeId:id,organizationId:"org-a",status:"ACTIVE",roles:[role]},
});
const render=(page:unknown,filters:Record<string,string|string[]|undefined>={})=>
 (page as (props:{searchParams:Promise<Record<string,string|string[]|undefined>>})=>Promise<unknown>)({
  searchParams:Promise.resolve(filters),
 });
beforeEach(()=>{
 vi.clearAllMocks();
 state.context.mockResolvedValue(identity());
 state.redirect.mockImplementation(()=>{throw new Error("REDIRECT_TO_DASHBOARD")});
 state.getDb.mockImplementation(()=>{throw new Error("PRIVATE_DATABASE_ACCESS")});
});

describe("UX-tpo-LAST-THIRD-01 all fourteen reports defend role, tenant and ambiguity",()=>{
 it("preserves exactly fourteen independent TPO report routes",()=>{
  expect(pages).toHaveLength(14);
  expect(new Set(pages.map(page=>page.name)).size).toBe(14);
 });
 it.each(pages)("UX-tpo-LAST-THIRD-01 /tpo/reports/$name rejects missing session membership without touching database",async({page})=>{
  state.context.mockResolvedValueOnce({...identity(),membership:null});
  await expect(render(page)).rejects.toThrow("REDIRECT_TO_DASHBOARD");
  expect(state.getDb).not.toHaveBeenCalled();
 });
 it.each(pages)("UX-tpo-LAST-THIRD-01 /tpo/reports/$name refuses a learner or College Admin without leaking report metrics",async({page})=>{
  for(const role of ["LEARNER","COLLEGE_ADMIN"] as const){
   state.context.mockResolvedValueOnce(identity(role));
   await expect(render(page)).rejects.toThrow("REDIRECT_TO_DASHBOARD");
  }
  expect(state.getDb).not.toHaveBeenCalled();
 });
 it.each(pages)("UX-tpo-LAST-THIRD-01 /tpo/reports/$name rejects a disabled officer's expired principal",async({page})=>{
  state.context.mockResolvedValueOnce(identity("TPO","DISABLED"));
  await expect(render(page)).rejects.toThrow("REDIRECT_TO_DASHBOARD");
  expect(state.getDb).not.toHaveBeenCalled();
 });
 it.each(pages)("UX-tpo-LAST-THIRD-01 /tpo/reports/$name refuses repeated season selectors before any report query",async({page,name})=>{
  const view=await render(page,{seasonId:[id,id]});
  expect(view).toMatchObject({props:{path:"/tpo/reports/"+name}});
  expect(state.getDb).not.toHaveBeenCalled();
 });
});
