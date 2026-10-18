import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
const state=vi.hoisted(()=>({
 scope:vi.fn(),ready:vi.fn(),db:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:state.db}));
vi.mock("@/modules/placements/scope",()=>({
 requirePlacementManageScope:state.scope,
}));
vi.mock("@/modules/placements/public-join/readiness",()=>({
 publicJoinTablesReady:state.ready,
}));
import {
 changeTpoPublicJoinLink,getTpoPublicJoinLinkStatus,setTpoPublicJoinLinkEnabled,
} from "@/modules/placements/tpo-public-join-link-service";
const id="00000000-0000-4000-8000-000000000001";
const ctx=(roles:readonly ("TPO"|"COLLEGE_ADMIN"|"LEARNER")[]=["TPO"],status:"ACTIVE"|"SUSPENDED"="ACTIVE",
 platform:"ACTIVE"|"DISABLED"="ACTIVE"):RequestContext=>({
 user:{id:"staff",identityUid:"staff-id",platformStatus:platform,systemRoles:[]},
 membership:{id:"staff-membership",organizationId:"org-a",collegeId:id,status,roles},
});
beforeEach(()=>{
 vi.clearAllMocks();
 state.scope.mockResolvedValue({id,organizationId:"org-a"});
 state.ready.mockResolvedValue(false);
});

describe("TPO-settings-audit-55 public links: live access and failure semantics",()=>{
 it("TPO-settings-audit-55 denies wrong roles, disabled sessions and removed memberships before any link read",async()=>{
  const rejected=[
   ctx(["LEARNER"]),ctx(["TPO"],"SUSPENDED"),
   ctx(["TPO"],"ACTIVE","DISABLED"),{...ctx(),membership:null},
  ];
  for(const actor of rejected){
   await expect(getTpoPublicJoinLinkStatus(actor,"COLLEGE")).rejects.toThrow();
   await expect(changeTpoPublicJoinLink(actor,{scope:"COLLEGE",action:"CREATE",confirmed:true})).rejects.toThrow();
   await expect(setTpoPublicJoinLinkEnabled(actor,{scope:"COLLEGE",enabled:false,expectedLinkId:id})).rejects.toThrow();
  }
  expect(state.scope).not.toHaveBeenCalled();
  expect(state.db).not.toHaveBeenCalled();
 });
 it("TPO-settings-audit-55 accepts placement admin role but never guesses a foreign college context",async()=>{
  expect(await getTpoPublicJoinLinkStatus(ctx(["COLLEGE_ADMIN"]),"COLLEGE")).toEqual({
   ready:false,domain:null,link:null,
  });
  expect(state.scope).toHaveBeenCalledWith(expect.objectContaining({
   membership:expect.objectContaining({collegeId:id}),
  }),id);
  expect(state.db).not.toHaveBeenCalled();
  state.scope.mockRejectedValueOnce(new Error("FOREIGN_COLLEGE"));
  await expect(getTpoPublicJoinLinkStatus(ctx(),"COLLEGE")).rejects.toThrow("FOREIGN_COLLEGE");
  expect(state.db).not.toHaveBeenCalled();
 });
 it("TPO-settings-audit-55 refuses storage-unready create, replace and toggle without touching link rows",async()=>{
  const valid={scope:"COLLEGE",action:"CREATE",confirmed:true} as const;
  await expect(changeTpoPublicJoinLink(ctx(),valid)).rejects.toMatchObject({code:"NOT_REGISTERED"});
  await expect(setTpoPublicJoinLinkEnabled(ctx(),{
   scope:"COLLEGE",expectedLinkId:id,enabled:false,
  })).rejects.toMatchObject({code:"NOT_REGISTERED"});
  expect(state.ready).toHaveBeenCalledTimes(2);
  expect(state.db).not.toHaveBeenCalled();
 });
 it("TPO-settings-audit-55 rejects forged company/body data and missing compare-and-swap IDs",async()=>{
  for(const payload of [
   {scope:"COMPANY",action:"CREATE",confirmed:true},
   {scope:"COMPANY",action:"CREATE",confirmed:true,companyId:"not-an-id"},
   {scope:"COLLEGE",action:"REPLACE",confirmed:true},
   {scope:"COLLEGE",action:"CREATE",confirmed:false},
   {scope:"COLLEGE",action:"CREATE",confirmed:true,organizationId:"forged"},
   {scope:"COLLEGE",action:"CREATE",confirmed:true,expectedLinkId:id},
  ])await expect(changeTpoPublicJoinLink(ctx(),payload)).rejects.toThrow();
  for(const payload of [
   {scope:"COLLEGE",enabled:false},
   {scope:"COMPANY",enabled:true,companyId:id},
   {scope:"COLLEGE",enabled:true,expectedLinkId:"invalid"},
   {scope:"COLLEGE",enabled:true,expectedLinkId:id,collegeId:"forged"},
  ])await expect(setTpoPublicJoinLinkEnabled(ctx(),payload)).rejects.toThrow();
  expect(state.scope).not.toHaveBeenCalled();
  expect(state.db).not.toHaveBeenCalled();
 });
});
