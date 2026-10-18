import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
const state=vi.hoisted(()=>({db:vi.fn(),scope:vi.fn(),act:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:state.db}));
vi.mock("@/modules/placements/scope",()=>({requirePlacementManageScope:state.scope}));
vi.mock("@/modules/placements/round-service",()=>({actOnPlacementRound:state.act}));
import {listTpoCalendarRoundChoices,decideTpoCalendarRound}
 from "@/modules/placements/tpo-round-calendar-service";
const uuid="00000000-0000-4000-8000-000000000001";
const context=(role:string,status="ACTIVE",platformStatus="ACTIVE"):RequestContext=>({
 user:{id:"actor",identityUid:"sso",platformStatus,systemRoles:[]},
 membership:{id:"membership",collegeId:"college-a",organizationId:"org-a",status,roles:[role]},
}) as unknown as RequestContext;
const input={confirmed:true,roundId:uuid,expectedUpdatedAt:"2026-10-19T09:00:00+05:30",
 action:"SCHEDULE",localDateTime:"2026-10-20T09:30",mode:"ON_CAMPUS",venue:"Hall A"};
beforeEach(()=>{
 for(const mock of Object.values(state))mock.mockReset();
 state.scope.mockResolvedValue({id:"college-a"});
});
describe("TPO-BREAK-calendar-13 deny unauthorized searches and forged round changes before DB access",()=>{
 for(const role of ["LEARNER","FACULTY","COLLEGE_ADMIN","MENTOR","HR"]){
  it(`blocks ${role} from both TPO calendar reads and mutations`,async()=>{
   await expect(listTpoCalendarRoundChoices(context(role),{})).rejects.toThrow();
   await expect(decideTpoCalendarRound(context(role),input)).rejects.toThrow();
   expect(state.scope).not.toHaveBeenCalled();
   expect(state.db).not.toHaveBeenCalled();
   expect(state.act).not.toHaveBeenCalled();
  });
 }
 for(const [status,platform] of [["SUSPENDED","ACTIVE"],["ACTIVE","DISABLED"]] as const){
  it(`blocks TPO calendar with ${status}/${platform} account before DB access`,async()=>{
   const actor=context("TPO",status,platform);
   await expect(listTpoCalendarRoundChoices(actor,{})).rejects.toThrow();
   await expect(decideTpoCalendarRound(actor,input)).rejects.toThrow();
   expect(state.db).not.toHaveBeenCalled();
  });
 }
 it("rejects duplicate-scope filters, pagination overflow and malformed search inputs",async()=>{
  const actor=context("TPO");
  for(const query of [
   {collegeId:uuid},{page:0},{page:10001},{page:"NaN"},{q:"x".repeat(101)},
   {kind:"OTHER"},{kind:["ALL","INTERVIEW"]},
  ]){
   await expect(listTpoCalendarRoundChoices(actor,query)).rejects.toThrow();
   expect(state.db).not.toHaveBeenCalled();
   expect(state.scope).not.toHaveBeenCalled();
  }
 });
 it("denies correct-role, wrong-college scope before a calendar query or mutation",async()=>{
  const actor=context("TPO");
  state.scope.mockRejectedValueOnce(new Error("COLLEGE_SCOPE_DENIED"));
  await expect(listTpoCalendarRoundChoices(actor,{page:1,kind:"INTERVIEW"}))
   .rejects.toThrow("COLLEGE_SCOPE_DENIED");
  state.scope.mockRejectedValueOnce(new Error("COLLEGE_SCOPE_DENIED"));
  await expect(decideTpoCalendarRound(actor,input)).rejects.toThrow("COLLEGE_SCOPE_DENIED");
  expect(state.db).not.toHaveBeenCalled();
  expect(state.act).not.toHaveBeenCalled();
 });
 it("forged company/tenant IDs or absent confirmation cannot produce a round change",async()=>{
  for(const invalid of [
   {...input,confirmed:false},
   {...input,collegeId:uuid},
   {...input,jobId:uuid},
   {...input,roundId:"../../../college-b"},
   {...input,expectedUpdatedAt:"stale"},
  ]){
   await expect(decideTpoCalendarRound(context("TPO"),invalid)).rejects.toThrow();
   expect(state.db).not.toHaveBeenCalled();
   expect(state.act).not.toHaveBeenCalled();
  }
 });
});
