import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const m=vi.hoisted(()=>({ctx:vi.fn(),redirect:vi.fn(),issues:vi.fn(),
 logs:vi.fn(),known:vi.fn()}));
vi.mock("server-only",()=>({}));
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

describe("SA-TRACKER-AUDIT-67 global issues and error logs stay outside acting tenant scopes",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue(root);
  m.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
 });
 it.each([
  ["college",{collegeId:"11111111-1111-4111-8111-111111111111",organizationId:null}],
  ["organization",{collegeId:null,organizationId:"22222222-2222-4222-8222-222222222222"}],
 ])("acting in %s must not open global Tracker issues or private logs",async(_name,scope)=>{
  m.ctx.mockResolvedValue({...root,adminScope:scope});
  await expect(callIssues()).rejects.toThrow("REDIRECT");
  await expect(callLogs()).rejects.toThrow("REDIRECT");
  expect(m.redirect).toHaveBeenCalledWith("/dashboard");
  expect(m.issues).not.toHaveBeenCalled();
  expect(m.known).not.toHaveBeenCalled();
  expect(m.logs).not.toHaveBeenCalled();
 });
 it("a disabled Super Admin must be refused before privileged reads",async()=>{
  m.ctx.mockResolvedValue({...root,user:{...root.user,platformStatus:"DISABLED"}});
  await expect(callIssues()).rejects.toThrow("REDIRECT");
  await expect(callLogs()).rejects.toThrow("REDIRECT");
  expect(m.issues).not.toHaveBeenCalled();
  expect(m.known).not.toHaveBeenCalled();
 });
 it("a recruiter company grant is not a global issue or error-log permission",async()=>{
  m.ctx.mockResolvedValue({...root,user:{...root.user,systemRoles:[]},
   recruiter:{userId:"root",status:"ACTIVE",companyId:"firm-a",companyName:"Firm A",
    title:null,grants:[]}} as RequestContext);
  await expect(callIssues()).rejects.toThrow("REDIRECT");
  await expect(callLogs()).rejects.toThrow("REDIRECT");
  expect(m.issues).not.toHaveBeenCalled();
  expect(m.known).not.toHaveBeenCalled();
 });
});
