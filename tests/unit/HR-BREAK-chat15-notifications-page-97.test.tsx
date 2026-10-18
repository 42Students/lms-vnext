import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement,type ReactNode} from "react";
const m=vi.hoisted(()=>({ctx:vi.fn(),redirect:vi.fn(),list:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("next/navigation",()=>({redirect:m.redirect}));
vi.mock("@/modules/placements/hr-notifications-service",()=>({listHrNotifications:m.list}));
vi.mock("@/components/hr/hr-notification-read-button",()=>({HrNotificationReadButton:()=>null}));
import HrNotificationsPage from "@/app/(authenticated)/hr/notifications/page";

const collegeId="123e4567-e89b-42d3-a456-426614174001";
const actor={user:{id:"recruiter",platformStatus:"ACTIVE",systemRoles:[]},
 recruiter:{userId:"recruiter",status:"ACTIVE",companyId:"company",grants:[
  {id:"grant",collegeId,collegeName:"College",companyRelationshipId:"relationship"},
 ]}};
const view=(params:Record<string,string|string[]|undefined>={})=>
 HrNotificationsPage({searchParams:Promise.resolve(params)});
function text(node:ReactNode):string{
 if(Array.isArray(node))return node.map(text).join(" ");
 if(typeof node==="string"||typeof node==="number")return String(node);
 if(!isValidElement(node))return "";
 const p=node.props as {title?:string;description?:string;children?:ReactNode};
 return [p.title??"",p.description??"",text(p.children)].join(" ");
}
function links(node:ReactNode):string[]{
 if(Array.isArray(node))return node.flatMap(links);
 if(!isValidElement(node))return [];
 const p=node.props as {href?:string;children?:ReactNode};
 return [...(p.href?[p.href]:[]),...links(p.children)];
}
describe("HR-NOTIFICATIONS-PAGE-97 private recruiter notices and recovery",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue(actor);
  m.redirect.mockImplementation(()=>{throw Error("REDIRECT");});
  m.list.mockResolvedValue({status:"READY",collegeId,choices:actor.recruiter.grants,
   rows:[],unread:0,total:0,page:1,pages:0,first:0,last:0});
 });
 it("forbids inactive and mismatched recruiter sessions before notification data reads",async()=>{
  for(const context of [
   {...actor,user:{...actor.user,platformStatus:"DISABLED"}},
   {...actor,recruiter:{...actor.recruiter,userId:"another"}},
  ]){
   m.ctx.mockResolvedValueOnce(context);
   await expect(view()).rejects.toThrow("REDIRECT");
  }
  expect(m.list).not.toHaveBeenCalled();
 });
 it("array, invalid sort and oversized search filters produce a safe reset",async()=>{
  for(const params of [
   {collegeId:[collegeId,collegeId]},{unreadOnly:"maybe"},{q:"x".repeat(121)},
  ]){
   const output=await view(params);
   expect(text(output)).toContain("Invalid inbox filter.");
   expect(links(output)).toContain("/hr/notifications");
  }
  expect(m.list).not.toHaveBeenCalled();
 });
 it("zero grants show a no-access explanation without leaking hiring drives",async()=>{
  m.list.mockResolvedValue({status:"NO_ACCESS",choices:[],rows:[]});
  const output=await view();
  expect(text(output)).toContain("No active college access.");
  expect(links(output).some(x=>x.includes("jobs/"))).toBe(false);
 });
 it("authorized empty notification inbox is distinct from conversations",async()=>{
  const output=await view({unreadOnly:"true"});
  expect(text(output)).toContain("No matching notifications for this employer and college.");
  expect(links(output)).toContain("/hr/conversations");
  expect(m.list).toHaveBeenCalledWith(actor,expect.objectContaining({unreadOnly:"true"}));
 });
 it("persisted notice is grouped by authorized drive and marked unread only when readAt is null",async()=>{
  m.list.mockResolvedValue({status:"READY",collegeId,choices:actor.recruiter.grants,
   rows:[{id:"notice",jobId:"owned",title:"Engineer",label:"Drive published",
    createdAt:new Date("2099-05-01T00:00:00Z"),unread:true}],
   unread:1,total:1,page:1,pages:1,first:1,last:1});
  const output=await view();
  expect(text(output)).toContain("Drive published");
  expect(text(output)).toContain("Unread");
  expect(links(output)).toContain("/hr/placements/jobs/owned");
 });
});