import {beforeEach,describe,expect,it,vi} from "vitest";
import React from "react";
import type {RequestContext} from "@/modules/identity/context";
vi.mock("server-only",()=>({}));
const stubs=vi.hoisted(()=>({
 context:vi.fn(),list:vi.fn(),summary:vi.fn(),redirect:vi.fn(),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:stubs.context}));
vi.mock("@/modules/placements/super-admin-hr-service",()=>({
 listSuperAdminHrAccounts:stubs.list,
 getSuperAdminHrStatusSummary:stubs.summary,
}));
vi.mock("next/navigation",()=>({
 redirect:stubs.redirect,
}));
import SuperAdminHrPage from "@/app/(authenticated)/admin/hr/page";
import SuperAdminRecruiterAlias from "@/app/(authenticated)/admin/recruiters/page";
const context:RequestContext={
 user:{id:"admin",identityUid:"admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:null,
};
const input={searchParams:Promise.resolve({})};
beforeEach(()=>{
 vi.resetAllMocks();
 stubs.context.mockResolvedValue(context);
 stubs.list.mockResolvedValue({items:[],total:0,page:1,pageSize:25,totalPages:1});
 stubs.summary.mockResolvedValue({accounts:0,active:0,archived:0,disabled:0});
 stubs.redirect.mockImplementation((dest:string)=>{throw new Error("REDIRECT:"+dest);});
});
describe("SA-RECRUITERS-PARTIAL-01 administrative recruiter directory resilience",()=>{
 it("legacy /admin/recruiters aliases the same guarded /admin/hr route",()=>{
  expect(SuperAdminRecruiterAlias).toBe(SuperAdminHrPage);
 });
 it("still renders the selected-scoped account list while summary query is offline",async()=>{
  stubs.summary.mockRejectedValueOnce(new Error("database socket reset"));
  const view=await SuperAdminRecruiterAlias(input);
  expect(React.isValidElement<{statusSummary:unknown;list:unknown;loadError:unknown}>(view)).toBe(true);
  if(!React.isValidElement<{statusSummary:unknown;list:unknown;loadError:unknown}>(view))throw new Error("missing result");
  expect(view.props.statusSummary).toBeNull();
  expect(view.props.loadError).toBeNull();
  expect(view.props.list).toMatchObject({total:0,items:[]});
  expect(stubs.list).toHaveBeenCalledOnce();
 });
 it("does not invent a successful directory when its primary list query fails",async()=>{
  stubs.list.mockRejectedValueOnce(new Error("db temporarily unavailable"));
  const view=await SuperAdminHrPage(input);
  if(!React.isValidElement<{list:unknown;loadError:unknown}>(view))throw new Error("missing result");
  expect(view.props.list).toBeNull();
  expect(view.props.loadError).toBe("The recruiter directory could not be loaded. Retry the request or check the selected administrative scope.");
 });
 it("denies Faculty and disabled Super Admin before either recruiter query",async()=>{
  const denied:RequestContext[]=[
   {...context,user:{...context.user,systemRoles:[]},
    membership:{id:"faculty",collegeId:"college",organizationId:"org",
     status:"ACTIVE",roles:["FACULTY"]}},
   {...context,user:{...context.user,platformStatus:"DISABLED"}},
  ];
  for(const actor of denied){
   stubs.context.mockResolvedValueOnce(actor);
   await expect(SuperAdminHrPage(input)).rejects.toThrow("Missing permission: admin-scope.select");
  }
  expect(stubs.list).not.toHaveBeenCalled();
  expect(stubs.summary).not.toHaveBeenCalled();
 });
});
