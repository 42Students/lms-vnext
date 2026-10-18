import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import type {ReactNode} from "react";
import type {ActiveMembership,RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";

const mock=vi.hoisted(()=>({context:vi.fn(),actor:vi.fn(),redirect:vi.fn(),db:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("next/navigation",()=>({redirect:(href:string)=>{
 mock.redirect(href);throw new Error("REDIRECT_TO_"+href);
}}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mock.context}));
vi.mock("@/modules/placements/tpo-batch-workspace-read-service",()=>({requireTpoBatchActor:mock.actor}));
vi.mock("@/db/client",()=>({getDb:mock.db}));
vi.mock("@/components/ui/page-header",()=>({PageHeader:({title}:{title:string})=><h1>{title}</h1>}));
vi.mock("@/components/ui/error-state",()=>({
 ErrorState:({title,description,action}:{title:string;description:string;action:ReactNode})=>
  <section role="alert"><h2>{title}</h2><p>{description}</p>{action}</section>,
}));
import TpoAuditPage from "@/app/(authenticated)/tpo/audit/page";
import TpoActorAuditPage from "@/app/(authenticated)/tpo/audit/actors/page";

const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const context=(roles:ActiveMembership["roles"]):RequestContext=>({
 user:{id:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",identityUid:"tpo-audit-pages",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"cccccccc-cccc-4ccc-8ccc-cccccccccccc",collegeId:COLLEGE,
  organizationId:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",status:"ACTIVE",roles},
});
const audit=(query:Record<string,string|string[]>={})=>
 TpoAuditPage({searchParams:Promise.resolve(query)});
const actor=(query:Record<string,string|string[]>={})=>
 TpoActorAuditPage({searchParams:Promise.resolve(query)});

describe("UX-tpo-audit-revoked-08 real page SSR role and invalid-filter branches",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mock.context.mockResolvedValue(context(["TPO"]));
  mock.actor.mockResolvedValue(COLLEGE);
 });
 it("denies Learner or Faculty roles before either audit page discloses data",async()=>{
  mock.context.mockResolvedValueOnce(context(["LEARNER"]));
  await expect(audit()).rejects.toThrow("REDIRECT_TO_/dashboard");
  mock.context.mockResolvedValueOnce(context(["FACULTY"]));
  await expect(actor()).rejects.toThrow("REDIRECT_TO_/dashboard");
  expect(mock.actor).not.toHaveBeenCalled();
  expect(mock.db).not.toHaveBeenCalled();
 });
 it("persisted role revocation stops both audit pages before accepting query parameters",async()=>{
  mock.actor.mockRejectedValue(new AuthorizationError("placements.manage"));
  await expect(audit({page:"1"})).rejects.toBeInstanceOf(AuthorizationError);
  await expect(actor({page:"1"})).rejects.toBeInstanceOf(AuthorizationError);
  expect(mock.actor).toHaveBeenCalledTimes(2);
  expect(mock.db).not.toHaveBeenCalled();
 });
 it("invalid canonical actor/ID and invalid audit dates show recoverable alerts without SQL",async()=>{
  const badGeneral=renderToStaticMarkup(await audit({from:"2099-12-31",to:"2099-01-01"}));
  expect(badGeneral).toContain("Invalid audit filters");
  expect(badGeneral).toContain("No audit data was loaded.");
  expect(badGeneral).toContain("Clear filters");
  expect(badGeneral).toContain('role="alert"');
  const badActor=renderToStaticMarkup(await actor({page:"0",actorId:"../other-college"}));
  expect(badActor).toContain("Invalid audit filters");
  expect(badActor).toContain("Clear filters");
  expect(badActor).toContain('role="alert"');
  expect(badActor).not.toContain("../other-college");
  expect(mock.db).not.toHaveBeenCalled();
 });
});
