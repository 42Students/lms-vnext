import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import type {RequestContext} from "@/modules/identity/context";
const mock=vi.hoisted(()=>({context:vi.fn(),read:vi.fn(),redirect:vi.fn(),notFound:vi.fn()}));
vi.mock("next/navigation",()=>({
 redirect:(url:string)=>{mock.redirect(url);throw new Error("REDIRECT_TO_"+url);},
 notFound:()=>{mock.notFound();throw new Error("NOT_FOUND");},
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mock.context}));
vi.mock("@/modules/placements/placement-team-access-model",()=>({
 hasPlacementTeamMembership:(ctx:RequestContext)=>Boolean(ctx.membership?.roles.includes("TPO")),
}));
vi.mock("@/modules/placements/tpo-company-team-service",()=>({
 readTpoCompanyTeam:mock.read,
 TpoCompanyTeamError:class TpoCompanyTeamError extends Error{
  constructor(readonly code:string){super(code);}
 },
}));
vi.mock("@/components/ui/page-header",()=>({PageHeader:({title}:{title:string})=><h1>{title}</h1>}));
vi.mock("@/components/tpo/tpo-company-team-composer",()=>({
 TpoCompanyTeamComposer:()=> <p>Composer available</p>,
}));
vi.mock("@/components/tpo/tpo-live-refresh",()=>({TpoLiveRefresh:()=>null}));
import TpoCompanyTeamPage from "@/app/(authenticated)/tpo/companies/[companyId]/team/page";
const COMPANY="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ctx:RequestContext={
 user:{id:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",identityUid:"team-ssr",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  collegeId:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  organizationId:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  status:"ACTIVE",roles:["TPO"]},
};
const page=(id=COMPANY)=>TpoCompanyTeamPage({params:Promise.resolve({companyId:id})});
const model=(overrides:Record<string,unknown>={})=>({
 status:"READY",companyName:"Example Employer",
 messages:[],members:[],following:false,truncated:false,canPost:true,...overrides,
});
describe("UX-tpo-company-team-history-01 transparent, tenant-scoped team page states",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mock.context.mockResolvedValue(ctx);
  mock.read.mockResolvedValue(model());
 });
 it("redirects wrong role before reading private employer conversation",async()=>{
  mock.context.mockResolvedValueOnce({...ctx,membership:{...ctx.membership!,roles:["LEARNER"]}});
  await expect(page()).rejects.toThrow("REDIRECT_TO_/dashboard");
  expect(mock.read).not.toHaveBeenCalled();
 });
 it("rejects malformed company ID without querying the stored messages",async()=>{
  await expect(page("../other-college")).rejects.toThrow("NOT_FOUND");
  expect(mock.read).not.toHaveBeenCalled();
 });
 it("discloses a limited last-100 history instead of implying full coverage",async()=>{
  mock.read.mockResolvedValueOnce(model({truncated:true,messages:[{
   id:"message-one",authorName:"TPO Officer",body:"Scoped follow-up",
   createdAt:new Date("2099-01-01T00:00:00.000Z"),
  }]}));
  const html=renderToStaticMarkup(await page());
  expect(html).toContain("Showing the latest 100 company Team messages");
  expect(html).toContain("Older messages are not loaded here");
  expect(html).toContain("Scoped follow-up");
  expect(html).toContain(" IST");
  expect(html).toContain("Composer available");
 });
 it("renders truthful no-storage and archived read-only states",async()=>{
  mock.read.mockResolvedValueOnce({status:"NOT_REGISTERED",companyName:"Example Employer",
   messages:[],members:[],following:false,truncated:false,canPost:false});
  const missing=renderToStaticMarkup(await page());
  expect(missing).toContain("require their registered database migration");
  expect(missing).not.toContain("Composer available");
  mock.read.mockResolvedValueOnce(model({canPost:false}));
  const archived=renderToStaticMarkup(await page());
  expect(archived).toContain("This relationship is archived. Its discussion is read-only");
  expect(archived).not.toContain("Composer available");
 });
 it("shows an honest empty active conversation and exact company link",async()=>{
  const html=renderToStaticMarkup(await page());
  expect(html).toContain("No company Team messages yet.");
  expect(html).toContain("Composer available");
  expect(html).toContain("/tpo/companies/"+COMPANY);
  expect(mock.read).toHaveBeenCalledWith(ctx,COMPANY);
 });
});
