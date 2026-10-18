import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement,type ReactNode} from "react";
import type {RequestContext} from "@/modules/identity/context";

const m=vi.hoisted(()=>({context:vi.fn(),notifications:vi.fn(),redirect:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.context}));
vi.mock("@/modules/placements/hr-notifications-service",()=>({listHrNotifications:m.notifications}));
vi.mock("next/navigation",()=>({redirect:m.redirect}));
import HrNotificationsPage from "@/app/(authenticated)/hr/notifications/page";

const college="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const actor:RequestContext={
 user:{id:"recruiter",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,
 recruiter:{userId:"recruiter",companyId:"firm-a",companyName:"Employer A",
  title:null,status:"ACTIVE",grants:[{
   id:"grant",collegeId:college,organizationId:"org-a",collegeName:"College A",
   companyRelationshipId:"relation-a",
  }]},
};
const grant=actor.recruiter!.grants[0]!;
const view=(query:Record<string,unknown>={})=>HrNotificationsPage({
 searchParams:Promise.resolve(query) as never,
});
function renderText(node:ReactNode):string {
 if(Array.isArray(node))return node.map(renderText).join(" ");
 if(typeof node==="number"||typeof node==="string")return String(node);
 if(!isValidElement(node))return "";
 const props=node.props as {children?:ReactNode,title?:string,description?:string};
 return [props.title??"",props.description??"",renderText(props.children)].join(" ");
}
function links(node:ReactNode):string[] {
 if(Array.isArray(node))return node.flatMap(links);
 if(!isValidElement(node))return [];
 const p=node.props as {href?:unknown,children?:ReactNode};
 return [...(typeof p.href==="string"?[p.href]:[]),...links(p.children)];
}

describe("HR-BREAK-chat19-notifications-page: recruiter-scoped page behavior",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  m.context.mockResolvedValue(actor);
  m.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
  m.notifications.mockResolvedValue({
   status:"READY",collegeId:college,choices:[grant],rows:[],
   unread:0,total:0,truncated:false,page:1,pages:0,first:0,last:0,
  });
 });
 it("denies disabled sessions without querying private notification details",async()=>{
  m.context.mockResolvedValue({...actor,user:{...actor.user,platformStatus:"DISABLED"}});
  await expect(view()).rejects.toThrow("REDIRECT");
  expect(m.redirect).toHaveBeenCalledWith("/dashboard");
  expect(m.notifications).not.toHaveBeenCalled();
 });
 it.each([
  {collegeId:"../admin"},{collegeId:"invalid"},
  {page:"0"},{page:"100000000"},{page:"1.5"},
  {q:"x".repeat(121)},{unreadOnly:"neither"},
  {collegeId:[college,other]},{page:["1","2"]},{q:["A","B"]},
 ])("invalid filter %j renders recoverable error without reading a tenant inbox",async raw=>{
  const output=await view(raw);
  expect(renderText(output)).toContain("Invalid inbox filter.");
  expect(links(output)).toContain("/hr/notifications");
  expect(m.notifications).not.toHaveBeenCalled();
 });
 it("valid scoped query is passed unchanged to service and empty message is explicit",async()=>{
  const output=await view({collegeId:college,unreadOnly:"true",q:" Software ",page:"1"});
  expect(m.notifications).toHaveBeenCalledTimes(1);
  const [ctx,query]=m.notifications.mock.calls[0]!;
  expect(ctx).toBe(actor);
  expect(query).toMatchObject({collegeId:college,unreadOnly:"true",q:"Software",page:1});
  expect(renderText(output)).toContain("No matching notifications for this employer and college.");
  expect(links(output).some(href=>href.includes("notifications/export?collegeId="+college))).toBe(true);
 });
 it("does not invent college access or render a cross-tenant notification on no-access",async()=>{
  m.notifications.mockResolvedValue({
   status:"NO_ACCESS",choices:[],rows:[],unread:0,total:0,
   page:1,pages:0,first:0,last:0,
  });
  const output=await view();
  expect(renderText(output)).toContain("No active college access.");
  expect(links(output).some(href=>href.startsWith("/hr/placements/jobs/"))).toBe(false);
 });
 it("requires college selection when multiple grants exist, with no private inbox content",async()=>{
  m.notifications.mockResolvedValue({
   status:"CHOOSE_COLLEGE",choices:[
    grant,{...grant,id:"grant-b",collegeId:other,collegeName:"College B"},
   ],rows:[],unread:0,total:0,page:1,pages:0,first:0,last:0,
  });
  const output=await view();
  expect(renderText(output)).toContain("Choose a college.");
  expect(links(output)).toContain("/hr/notifications?collegeId="+college);
  expect(links(output)).toContain("/hr/notifications?collegeId="+other);
 });
 it("HR-BREAK-NOTIFICATIONS-PRINCIPAL-29 blocks cross-user recruiter identity before any notice read",async()=>{
  m.context.mockResolvedValue({...actor,recruiter:{...actor.recruiter!,userId:"different-user"}});
  await expect(view()).rejects.toThrow("REDIRECT");
  expect(m.redirect).toHaveBeenCalledWith("/dashboard");
  expect(m.notifications).not.toHaveBeenCalled();
 });
});
