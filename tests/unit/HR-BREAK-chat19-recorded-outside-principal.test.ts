import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement,type ReactNode} from "react";
import type {RequestContext} from "@/modules/identity/context";
const m=vi.hoisted(()=>({context:vi.fn(),choices:vi.fn(),saved:vi.fn(),redirect:vi.fn(),notFound:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.context}));
vi.mock("@/modules/placements/recorded-outside-service",()=>({
 recordedOutsideChoices:m.choices,verifyRecordedOutsideConfirmation:m.saved,
}));
vi.mock("next/navigation",()=>({redirect:m.redirect,notFound:m.notFound}));
import HrRecordedOutsidePage from "@/app/(authenticated)/hr/drives/recorded-outside/page";
const college="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const actor:RequestContext={
 user:{id:"recruiter-a",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,recruiter:{userId:"recruiter-a",companyId:"company-a",companyName:"Employer",
 title:null,status:"ACTIVE",grants:[{id:"grant",organizationId:"org",collegeId:college,
 collegeName:"College",companyRelationshipId:"rel"}]},
};
function words(node:ReactNode):string{
 if(Array.isArray(node))return node.map(words).join(" ");
 if(typeof node==="string"||typeof node==="number")return String(node);
 if(!isValidElement(node))return "";
 const p=node.props as {title?:string;description?:string;children?:ReactNode};
 return [p.title??"",p.description??"",words(p.children)].join(" ");
}
const render=(params:Record<string,unknown>={})=>
 HrRecordedOutsidePage({searchParams:Promise.resolve(params) as never});
describe("HR-BREAK-RECORDED-PRINCIPAL-29: scoped outside-drive page",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.context.mockResolvedValue(actor);
  m.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
  m.notFound.mockImplementation(()=>{throw new Error("NOT_FOUND");});
  m.choices.mockResolvedValue({choices:[]});
  m.saved.mockResolvedValue(false);
 });
 it("denies another user's active recruiter grant before any private read",async()=>{
  m.context.mockResolvedValue({...actor,recruiter:{...actor.recruiter!,userId:"foreign-user"}});
  await expect(render()).rejects.toThrow("REDIRECT");
  expect(m.choices).not.toHaveBeenCalled();
  expect(m.saved).not.toHaveBeenCalled();
 });
 it("denies suspended sessions even when the college query is valid",async()=>{
  m.context.mockResolvedValue({...actor,user:{...actor.user,platformStatus:"DISABLED"}});
  await expect(render({collegeId:college})).rejects.toThrow("REDIRECT");
  expect(m.choices).not.toHaveBeenCalled();
 });
 it.each([{collegeId:[college,other]},{saved:["a","b"]},{collegeId:other},
   {collegeId:"../admin"}])(
  "rejects ambiguous or foreign college grant %j before reading choices",async params=>{
   await expect(render(params)).rejects.toThrow("NOT_FOUND");
   expect(m.choices).not.toHaveBeenCalled();
   expect(m.saved).not.toHaveBeenCalled();
  },
 );
 it("loads only an authorized college and does not fabricate publication success",async()=>{
  const output=await render({collegeId:college});
  expect(m.choices).toHaveBeenCalledWith(actor,college);
  expect(m.saved).not.toHaveBeenCalled();
  expect(words(output)).toContain("Record an outside-platform drive");
  expect(words(output)).not.toContain("External drive record saved.");
 });
});
