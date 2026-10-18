import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement,type ReactElement,type ReactNode} from "react";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requirePermission} from "@/modules/permissions/policy";
import {listInboundMailForAdmin} from "@/modules/inbound-mail/admin-service";
import type {RequestContext} from "@/modules/identity/context";
import {InboundMailList} from "@/components/admin/inbound-mail-list";
import InboundMailPage from "@/app/(authenticated)/admin/inbound-mail/page";

vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:vi.fn()}));
vi.mock("@/modules/permissions/policy",()=>({requirePermission:vi.fn()}));
vi.mock("@/modules/inbound-mail/admin-service",()=>({listInboundMailForAdmin:vi.fn()}));

const admin:RequestContext={
 user:{id:"sa",identityUid:"uid",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,
};
function nodes(value:ReactNode):ReactElement[]{
 if(Array.isArray(value))return value.flatMap(nodes);
 if(!isValidElement(value))return [];
 return [value,...nodes((value.props as {children?:ReactNode}).children)];
}
function visibleText(value:ReactNode):string{
 if(typeof value==="string")return value;
 if(Array.isArray(value))return value.map(visibleText).join(" ");
 if(isValidElement(value))return visibleText((value.props as {children?:ReactNode}).children);
 return "";
}
const request=(filters:Record<string,string|string[]|undefined>={})=>({searchParams:Promise.resolve(filters)});
beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(getCurrentRequestContext).mockResolvedValue(admin);
 vi.mocked(listInboundMailForAdmin).mockResolvedValue({
  available:true,items:[],page:1,hasMore:false,total:0,toReadCount:0,
 });
});

describe("chat-16 inbound-mail Super Admin page-level failure and privacy journeys",()=>{
 it("UX-chat16-inbound-mail-01 checks permission before reading filters or mailbox data",async()=>{
  await InboundMailPage(request());
  expect(getCurrentRequestContext).toHaveBeenCalledTimes(1);
  expect(requirePermission).toHaveBeenCalledWith(admin,"admin-scope.select");
  expect(listInboundMailForAdmin).toHaveBeenCalledTimes(1);
 });
 it("UX-chat16-inbound-mail-02 renders a safe reset instead of querying an invalid recipient or page",async()=>{
  for(const input of [{page:"0"},{status:"FORGED"},{recipient:"not-an-email"},{q:"x".repeat(121)}]){
   const result=await InboundMailPage(request(input));
   expect(visibleText(result)).toContain("Invalid filters.");
   expect(visibleText(result)).toContain("Reset");
  }
  expect(listInboundMailForAdmin).not.toHaveBeenCalled();
 });
 it("UX-chat16-inbound-mail-03 distinguishes missing storage from an empty inbox",async()=>{
  vi.mocked(listInboundMailForAdmin).mockResolvedValue({
   available:false,items:[],page:1,hasMore:false,total:null,toReadCount:null,
  });
  const result=await InboundMailPage(request());
  expect(visibleText(result)).toContain("Inbound mail storage has not been registered or deployed.");
  expect(visibleText(result)).toContain("Retry");
  expect(nodes(result).some(node=>node.type===InboundMailList)).toBe(false);
 });
 it("UX-chat16-inbound-mail-04 passes only server-loaded message data into its private list",async()=>{
  const receivedAt=new Date("2099-01-01T00:00:00Z");
  const id="11111111-1111-4111-8111-111111111111";
  vi.mocked(listInboundMailForAdmin).mockResolvedValue({
   available:true,page:2,hasMore:false,total:53,toReadCount:3,
   items:[{id,receivedAt,fromAddress:"sender@example.org",toAddress:"inbox@example.org",
    subject:"Question",bodyPlain:"Hello",status:"NEW",version:4}],
  });
  const result=await InboundMailPage(request({status:"NEW",page:"2",recipient:" Inbox@Example.org "}));
  expect(listInboundMailForAdmin).toHaveBeenCalledWith(admin,expect.objectContaining({
   status:"NEW",page:2,recipient:"inbox@example.org",
  }));
  const inbox=nodes(result).find(node=>node.type===InboundMailList);
  expect(inbox).toBeDefined();
  expect(inbox?.props).toMatchObject({rows:[{
   id,receivedAt:"2099-01-01T00:00:00.000Z",status:"NEW",version:4,
  }]});
  expect(visibleText(result)).toContain("53 matching messages");
 });
});
