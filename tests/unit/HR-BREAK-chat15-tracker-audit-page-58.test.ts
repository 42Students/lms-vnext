import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement,type ReactElement,type ReactNode} from "react";
import type {RequestContext} from "@/modules/identity/context";

const mocks=vi.hoisted(()=>({
 context:vi.fn(),permission:vi.fn(),ready:vi.fn(),list:vi.fn(),sync:vi.fn(),redirect:vi.fn(),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/modules/permissions/policy",()=>({requirePermission:mocks.permission}));
vi.mock("@/modules/bug-tracker/independent-audit-findings-service",()=>({
 independentAuditFindingsReady:mocks.ready,
 listIndependentAuditFindings:mocks.list,
 readIndependentFindingSyncState:mocks.sync,
}));
vi.mock("next/navigation",()=>({redirect:mocks.redirect}));
import FindingsPage from "@/app/(authenticated)/tracker/audit-findings/page";

const admin:RequestContext={
 user:{id:"root",identityUid:"root",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:null,
};
const page=(q:Record<string,string|string[]|undefined>={})=>
 FindingsPage({searchParams:Promise.resolve(q)});
function allNodes(node:ReactNode):ReactElement[]{
 if(Array.isArray(node))return node.flatMap(allNodes);
 if(!isValidElement(node))return [];
 const p=node.props as {children?:ReactNode};
 return [node,...allNodes(p.children)];
}
function visibleText(node:ReactNode):string{
 if(typeof node==="string"||typeof node==="number")return String(node);
 if(Array.isArray(node))return node.map(visibleText).join(" ");
 if(!isValidElement(node))return "";
 const p=node.props as {children?:ReactNode;title?:string;description?:string};
 return [p.title??"",p.description??"",visibleText(p.children)].join(" ");
}

describe("HR-TRACKER-PAGE-58: admin-only findings route resilient states",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  mocks.context.mockResolvedValue(admin);
  mocks.ready.mockReturnValue(true);
  mocks.sync.mockResolvedValue(null);
  mocks.list.mockResolvedValue({items:[],total:0,page:1,pages:0,
   criticalOpen:0,statusCounts:{}});
  mocks.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
 });
 it("denies non-admin and disabled accounts before permission or database calls",async()=>{
  for(const context of [
   {...admin,user:{...admin.user,systemRoles:[]}},
   {...admin,user:{...admin.user,platformStatus:"DISABLED" as const}},
  ]){
   mocks.context.mockResolvedValueOnce(context);
   await expect(page()).rejects.toThrow("REDIRECT");
  }
  expect(mocks.permission).not.toHaveBeenCalled();
  expect(mocks.list).not.toHaveBeenCalled();
  expect(mocks.sync).not.toHaveBeenCalled();
 });
 it("denies Super Admin acting inside a selected college without disclosing findings",async()=>{
  mocks.context.mockResolvedValue({...admin,adminScope:{
   collegeId:"11111111-1111-4111-8111-111111111111",organizationId:null,
  }});
  await expect(page()).rejects.toThrow("REDIRECT");
  expect(mocks.list).not.toHaveBeenCalled();
 });
 it("central permission denial never falls through to read privileged findings",async()=>{
  mocks.permission.mockImplementationOnce(()=>{throw new Error("FORBIDDEN");});
  await expect(page()).rejects.toThrow("FORBIDDEN");
  expect(mocks.list).not.toHaveBeenCalled();
  expect(mocks.sync).not.toHaveBeenCalled();
 });
 it.each([
  {page:["1","2"]},{page:"0"},{view:"PRIVATE"},{q:["one","two"]},
  {area:"x".repeat(81)},{status:"UNKNOWN"},{collegeId:"forged"},
 ])("invalid filters %j give a reset link without making an audit query",async filters=>{
  const result=await page(filters);
  expect(visibleText(result)).toContain("Invalid audit findings filters.");
  expect(allNodes(result).some(n=>(n.props as {href?:string}).href===
   "/tracker/audit-findings?view=OPEN")).toBe(true);
  expect(mocks.list).not.toHaveBeenCalled();
 });
 it("reports an unavailable backend honestly and never substitutes bug reports",async()=>{
  mocks.ready.mockReturnValue(false);
  const result=await page();
  expect(visibleText(result)).toContain("Audit findings are temporarily unavailable");
  expect(visibleText(result)).toContain("Please contact your platform administrator");
  expect(visibleText(result)).toContain("Bug reports are not substituted");
  expect(visibleText(result)).not.toContain("DB10_AUDIT_FINDINGS_READY");
  expect(mocks.list).not.toHaveBeenCalled();
 });
 it("reads only after admin authorization and exposes an explicit empty result",async()=>{
  const result=await page({view:"OPEN",page:"1"});
  expect(mocks.permission).toHaveBeenCalledWith(admin,"admin-scope.select");
  expect(mocks.list).toHaveBeenCalledWith(admin,expect.objectContaining({
   view:"OPEN",page:1,statuses:[],kinds:[],severities:[],
  }));
  expect(mocks.sync).toHaveBeenCalledWith(admin);
  const tables=allNodes(result).filter(n=>
   (n.props as {caption?:string}).caption==="Independent audit findings");
  expect(tables).toHaveLength(1);
  expect((tables[0]!.props as {rows:unknown[]}).rows).toEqual([]);
 });
 it("preserves the persisted finding's id and authorized detail link",async()=>{
  const item={id:"db-id",externalId:"AUD-0042",title:"Partial import",area:"Placement",
   kind:"BUG",severity:"HIGH",status:"NEW",assignee:null,foundBy:null,foundAt:null};
  mocks.list.mockResolvedValue({items:[item],total:1,page:1,pages:1,
   criticalOpen:0,statusCounts:{NEW:1}});
  const result=await page();
  const tables=allNodes(result).filter(n=>
   (n.props as {caption?:string}).caption==="Independent audit findings");
  expect((tables[0]!.props as {rows:unknown[]}).rows).toEqual([item]);
  expect(mocks.list).toHaveBeenCalledTimes(1);
 });
});
