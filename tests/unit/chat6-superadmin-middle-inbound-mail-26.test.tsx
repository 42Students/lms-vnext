import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {listInboundMailForAdmin} from "@/modules/inbound-mail/admin-service";
import InboundMailPage from "@/app/(authenticated)/admin/inbound-mail/page";

vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:vi.fn()}));
vi.mock("@/modules/inbound-mail/admin-service",()=>({listInboundMailForAdmin:vi.fn()}));
vi.mock("@/components/admin/inbound-mail-list",()=>({InboundMailList:()=>null}));
const context=(allowed=true)=>({
 user:{id:"11111111-1111-4111-8111-111111111111",identityUid:"identity",platformStatus:"ACTIVE",
  systemRoles:allowed?["SUPER_ADMIN"]:[]},
 membership:null,recruiter:null,adminScope:null,
});
const page=(params:Record<string,string|string[]|undefined>={})=>
 InboundMailPage({searchParams:Promise.resolve(params)});
beforeEach(()=>{
 vi.resetAllMocks();
 vi.mocked(getCurrentRequestContext).mockResolvedValue(context() as never);
 vi.mocked(listInboundMailForAdmin).mockResolvedValue({
  available:true,page:1,total:0,toReadCount:0,items:[],hasMore:false,
 } as never);
});
describe("SA-middle-inbound-mail-26 private inbox role and partial states",()=>{
 it("denies College Admin and Learner accounts before touching inbox storage",async()=>{
  vi.mocked(getCurrentRequestContext).mockResolvedValue(context(false) as never);
  await expect(page()).rejects.toThrow();
  expect(listInboundMailForAdmin).not.toHaveBeenCalled();
 });
 it("does not query inbox data on duplicate selector keys or impossible pages",async()=>{
  for(const params of [
   {status:["NEW","ALL"]},{q:["first","second"]},{page:"-100"},
  ]){
   const html=renderToStaticMarkup(await page(params));
   expect(html).toContain("Invalid filters");
  }
  expect(listInboundMailForAdmin).not.toHaveBeenCalled();
 });
 it("distinguishes a missing deployment from a genuinely empty inbox",async()=>{
  vi.mocked(listInboundMailForAdmin).mockResolvedValueOnce({
   available:false,
  } as never);
  const unavailable=renderToStaticMarkup(await page());
  expect(unavailable).toContain("inbox is unavailable");
  expect(unavailable).toContain("Retry");
  expect(unavailable).not.toContain("0 matching messages");
  const empty=renderToStaticMarkup(await page());
  expect(empty).toContain("0 matching messages");
  expect(empty).toContain("To read");
 });
 it("passes only schema-validated tenant actor and normalized inbox pagination",async()=>{
  await page({status:"TRIAGED",page:"2",q:"company"});
  expect(listInboundMailForAdmin).toHaveBeenCalledOnce();
  expect(listInboundMailForAdmin).toHaveBeenCalledWith(expect.anything(),
   expect.objectContaining({status:"TRIAGED",page:2,q:"company"}));
 });
 it("aborts on revoked session without inbox reads",async()=>{
  vi.mocked(getCurrentRequestContext).mockRejectedValue(new Error("Session revoked"));
  await expect(page()).rejects.toThrow("Session revoked");
  expect(listInboundMailForAdmin).not.toHaveBeenCalled();
 });
});
