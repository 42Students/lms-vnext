import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import type {ActiveMembership,RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";

const mock=vi.hoisted(()=>({
 context:vi.fn(),actor:vi.fn(),redirect:vi.fn(),archive:vi.fn(),everyone:vi.fn(),
}));
vi.mock("next/navigation",()=>({redirect:(href:string)=>{
 mock.redirect(href);throw new Error("REDIRECT_TO_"+href);
}}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mock.context}));
vi.mock("@/modules/placements/tpo-batch-workspace-read-service",()=>({requireTpoBatchActor:mock.actor}));
vi.mock("@/modules/placements/tpo-company-lifecycle-service",()=>({
 listArchivedTpoCompanyRelationships:mock.archive,
}));
vi.mock("@/modules/placements/tpo-team-everyone-service",()=>({readTpoTeamEveryone:mock.everyone}));
vi.mock("@/components/tpo/tpo-everyone-controls",()=>({
 TpoEveryoneControls:({muted}:{muted:boolean})=><p>Controls available: {muted?"muted":"not muted"}</p>,
}));
vi.mock("@/components/ui/page-header",()=>({PageHeader:({title}:{title:string})=><h1>{title}</h1>}));

import ArchivedCompanyRelationshipsPage from "@/app/(authenticated)/tpo/companies/archived/page";
import TpoEveryonePage from "@/app/(authenticated)/tpo/team/everyone/page";

const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const COMPANY="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const context=(roles:ActiveMembership["roles"]):RequestContext=>({
 user:{id:"cccccccc-cccc-4ccc-8ccc-cccccccccccc",identityUid:"tpo-ssr",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",collegeId:COLLEGE,
  organizationId:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",status:"ACTIVE",roles},
});
const everyonePage=(params:Record<string,string|string[]>={})=>
 TpoEveryonePage({searchParams:Promise.resolve(params)});

describe("UX-tpo-first-third-archived-01 archived company journey",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mock.context.mockResolvedValue(context(["TPO"]));
  mock.actor.mockResolvedValue(COLLEGE);
  mock.archive.mockResolvedValue({rows:[],truncated:false});
  mock.everyone.mockResolvedValue({status:"NOT_REGISTERED"});
 });
 it("denies wrong role and revoked persisted TPO before reading company relationships",async()=>{
  mock.context.mockResolvedValueOnce(context(["LEARNER"]));
  await expect(ArchivedCompanyRelationshipsPage()).rejects.toThrow("REDIRECT_TO_/dashboard");
  mock.actor.mockRejectedValueOnce(new AuthorizationError("placements.manage"));
  await expect(ArchivedCompanyRelationshipsPage()).rejects.toBeInstanceOf(AuthorizationError);
  expect(mock.archive).not.toHaveBeenCalled();
 });
 it("renders true empty-state copy without claiming deleted or cross-college relationships",async()=>{
  const html=renderToStaticMarkup(await ArchivedCompanyRelationshipsPage());
  expect(html).toContain("Archived company relationships");
  expect(html).toContain("No archived college-company relationships are recorded.");
  expect(html).toContain("/tpo/companies");
  expect(html).not.toContain("Review / restore");
 });
 it("warns about 100-row truncation and links to exact authorized company restoration",async()=>{
  mock.archive.mockResolvedValueOnce({rows:[{companyId:COMPANY,name:"Example Employer"}],truncated:true});
  const html=renderToStaticMarkup(await ArchivedCompanyRelationshipsPage());
  expect(html).toContain("Showing only the first 100 archived relationships.");
  expect(html).toContain("Example Employer");
  expect(html).toContain("/tpo/companies/"+COMPANY+"/manage");
  expect(html).toContain("Review / restore");
 });
});

describe("UX-tpo-first-third-everyone-01 team Everyone role, availability and pages",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mock.context.mockResolvedValue(context(["TPO"]));
  mock.actor.mockResolvedValue(COLLEGE);
  mock.archive.mockResolvedValue({rows:[],truncated:false});
  mock.everyone.mockResolvedValue({status:"NOT_REGISTERED"});
 });
 it("denies non-TPO roles before any team conversation fetch",async()=>{
  mock.context.mockResolvedValueOnce(context(["FACULTY"]));
  await expect(everyonePage()).rejects.toThrow("REDIRECT_TO_/dashboard");
  expect(mock.everyone).not.toHaveBeenCalled();
 });
 it("passes persisted authorization errors through instead of rendering private cached messages",async()=>{
  mock.everyone.mockRejectedValueOnce(new AuthorizationError("placements.manage"));
  await expect(everyonePage()).rejects.toBeInstanceOf(AuthorizationError);
 });
 it("uses bounded safe pages and explains missing Everyone storage without fabricated messages",async()=>{
  const html=renderToStaticMarkup(await everyonePage({page:"999999999"}));
  expect(mock.everyone).toHaveBeenCalledWith(context(["TPO"]),1);
  expect(html).toContain("Everyone is not available");
  expect(html).toContain("No team messages were loaded");
 });
 it("renders a friendly retry without raw backend errors",async()=>{
  mock.everyone.mockRejectedValueOnce(new Error("private database connection string"));
  const html=renderToStaticMarkup(await everyonePage());
  expect(html).toContain("Could not load Everyone right now.");
  expect(html).toContain("Retry Everyone");
  expect(html).toContain('role="alert"');
  expect(html).not.toContain("private database connection string");
 });
 it("renders an honest empty ready page with controls and no invented message",async()=>{
  mock.everyone.mockResolvedValueOnce({status:"READY",rows:[],muted:false,page:1,pages:1});
  const html=renderToStaticMarkup(await everyonePage());
  expect(html).toContain("Everyone conversation");
  expect(html).toContain("Controls available: not muted");
  expect(html).not.toContain("Older messages");
 });
 it("renders scoped authors and IST dates, pagination and mute status",async()=>{
  mock.everyone.mockResolvedValueOnce({
   status:"READY",muted:true,page:2,pages:3,rows:[{
    id:"ffffffff-ffff-4fff-8fff-ffffffffffff",authorMembershipId:context(["TPO"]).membership!.id,
    authorName:"Other user",createdAt:new Date("2099-01-01T00:00:00.000Z"),body:"Safe message",
   }],
  });
  const html=renderToStaticMarkup(await everyonePage({page:"2"}));
  expect(mock.everyone).toHaveBeenCalledWith(context(["TPO"]),2);
  expect(html).toContain("You");
  expect(html).toContain(" IST");
  expect(html).toContain("Safe message");
  expect(html).toContain("Older messages");
  expect(html).toContain("Newer messages");
  expect(html).toContain("Controls available: muted");
 });
});
