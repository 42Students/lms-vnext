import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {isValidElement,type ReactNode} from "react";

const m=vi.hoisted(()=>({ctx:vi.fn(),redirect:vi.fn(),issues:vi.fn(),
 logs:vi.fn(),known:vi.fn(),audit:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:()=>({insert:()=>({values:m.audit})})}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("next/navigation",()=>({redirect:m.redirect}));
vi.mock("@/modules/bug-tracker/admin-service",()=>({
 listBugTrackerIssuesForAdmin:m.issues,
}));
vi.mock("@/modules/log-alerts/admin-service",()=>({
 listKnownErrorsForAdmin:m.known,readLogAlertAdminState:m.logs,
}));
import IssuesPage from "@/app/(authenticated)/tracker/issues/page";
import LogsPage from "@/app/(authenticated)/tracker/logs/page";

const root:RequestContext={
 user:{id:"root",identityUid:"root",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:null,
};
const callIssues=()=>IssuesPage({searchParams:Promise.resolve({})});
const callLogs=()=>LogsPage({searchParams:Promise.resolve({})});
function textOf(node:ReactNode):string{
 if(Array.isArray(node))return node.map(textOf).join(" ");
 if(typeof node==="string"||typeof node==="number")return String(node);
 if(!isValidElement(node))return "";
 const props=node.props as {title?:ReactNode;description?:ReactNode;children?:ReactNode};
 return [textOf(props.title),textOf(props.description),textOf(props.children)].join(" ");
}

describe("SA-TRACKER-AUDIT-67 global issues and error logs stay outside acting tenant scopes",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue(root);
  m.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
  m.audit.mockResolvedValue(undefined);
 });
 it.each([
  ["college",{collegeId:"11111111-1111-4111-8111-111111111111",organizationId:null}],
  ["organization",{collegeId:null,organizationId:"22222222-2222-4222-8222-222222222222"}],
 ])("acting in %s must not open global Tracker issues or private logs",async(_name,scope)=>{
  m.ctx.mockResolvedValue({...root,adminScope:scope});
  await expect(callIssues()).rejects.toThrow("REDIRECT");
  const denied=await callLogs();
  expect(denied.type).toBe("section");
  expect(textOf(denied)).toContain("Sign in to view logs");
  expect(m.redirect).toHaveBeenCalledWith("/dashboard");
  expect(m.issues).not.toHaveBeenCalled();
  expect(m.known).not.toHaveBeenCalled();
  expect(m.logs).not.toHaveBeenCalled();
  expect(m.audit).toHaveBeenCalledTimes(1);
 });
 it("a disabled Super Admin must be refused before privileged reads",async()=>{
  m.ctx.mockResolvedValue({...root,user:{...root.user,platformStatus:"DISABLED"}});
  await expect(callIssues()).rejects.toThrow("REDIRECT");
  const denied=await callLogs();
  expect(denied.type).toBe("section");
  expect(textOf(denied)).toContain("Sign in to view logs");
  expect(m.issues).not.toHaveBeenCalled();
  expect(m.known).not.toHaveBeenCalled();
  expect(m.audit).toHaveBeenCalledTimes(1);
 });
 it("a recruiter company grant is not a global issue or error-log permission",async()=>{
  m.ctx.mockResolvedValue({...root,user:{...root.user,systemRoles:[]},
   recruiter:{userId:"root",status:"ACTIVE",companyId:"firm-a",companyName:"Firm A",
    title:null,grants:[]}} as RequestContext);
  await expect(callIssues()).rejects.toThrow("REDIRECT");
  const denied=await callLogs();
  expect(denied.type).toBe("section");
  expect(textOf(denied)).toContain("Sign in to view logs");
  expect(m.issues).not.toHaveBeenCalled();
  expect(m.known).not.toHaveBeenCalled();
 });
});
