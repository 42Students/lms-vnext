import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement,type ReactNode} from "react";
import type {RequestContext} from "@/modules/identity/context";
const m=vi.hoisted(()=>({ctx:vi.fn(),redirect:vi.fn(),calendar:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("next/navigation",()=>({redirect:m.redirect}));
vi.mock("@/modules/placements/recruiter-calendar-service",()=>({
 listRecruiterCalendarEvents:m.calendar,
}));
import HrCalendarPage from "@/app/(authenticated)/hr/calendar/page";
const collegeId="11111111-1111-4111-8111-111111111111";
const actor:RequestContext={
 user:{id:"recruiter",identityUid:"uid",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,recruiter:{userId:"recruiter",companyId:"employer",companyName:"Employer",
  status:"ACTIVE",title:null,grants:[{id:"grant",collegeId,companyRelationshipId:"relation",
   collegeName:"College",organizationId:"organization"}]},
};
const emptyCalendar={events:[],resultsDue:[],days:[],authorizedJobCount:0,
 summary:{rounds:0,deadlines:0}};
const view=(q:Record<string,string|string[]|undefined>={})=>
 HrCalendarPage({searchParams:Promise.resolve(q)});
function text(node:ReactNode):string{
 if(Array.isArray(node))return node.map(text).join(" ");
 if(typeof node==="string"||typeof node==="number")return String(node);
 if(!isValidElement(node))return "";
 const p=node.props as {children?:ReactNode;title?:string;description?:string;actions?:ReactNode};
 return [p.title??"",p.description??"",text(p.children),text(p.actions)].join(" ");
}
describe("HR-CALENDAR-PAGE-85: recruiter role, malformed query and safe empty schedule",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue(actor);m.calendar.mockResolvedValue(emptyCalendar);
  m.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
 });
 it("an inactive or identity-swapped recruiter cannot enumerate the calendar",async()=>{
  for(const context of [
   {...actor,user:{...actor.user,platformStatus:"DISABLED" as const}},
   {...actor,recruiter:{...actor.recruiter!,userId:"other"}},
  ]){
   m.ctx.mockResolvedValueOnce(context);
   await expect(view()).rejects.toThrow("REDIRECT");
  }
  expect(m.calendar).not.toHaveBeenCalled();
 });
 it("duplicate filter keys reject before reading private schedules",async()=>{
  const output=await view({date:["2099-01-01","2099-01-02"]});
  expect(text(output)).toContain("Invalid calendar filters.");
  expect(text(output)).toContain("Clear filters");
  expect(m.calendar).not.toHaveBeenCalled();
 });
 it("an actor without any college grants sees access recovery, never a phantom interview",async()=>{
  m.ctx.mockResolvedValue({...actor,recruiter:{...actor.recruiter!,grants:[]}});
  const output=await view({date:"2099-01-01",view:"week"});
  expect(text(output)).toContain("does not currently");
  expect(text(output)).toContain("Contact the placement cell");
  expect(m.calendar).toHaveBeenCalledTimes(1);
 });
 it("authorized empty week shows zero event counts without inventing an interview or result",async()=>{
  const output=await view({date:"2099-01-01",view:"week",category:"ALL"});
  expect(text(output)).toContain("Rounds, interview slots, deadlines and results due");
  expect(text(output)).toContain("Results due");
  expect(m.calendar).toHaveBeenCalledWith(actor,expect.objectContaining({
   from:expect.any(String),to:expect.any(String),
  }));
 });
});