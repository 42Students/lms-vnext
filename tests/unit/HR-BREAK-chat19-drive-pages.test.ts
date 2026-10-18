import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement,type ReactNode,type ReactElement} from "react";
import type {RequestContext} from "@/modules/identity/context";

const m=vi.hoisted(()=>({ctx:vi.fn(),rounds:vi.fn(),conversation:vi.fn(),
 slots:vi.fn(),workspace:vi.fn(),
 redirect:vi.fn(),notFound:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("@/modules/placements/hr-round-editor-service",()=>({listHrRoundEditorRows:m.rounds}));
vi.mock("@/modules/placements/hr-drive-conversation-service",()=>({getRecruiterDriveConversations:m.conversation}));
vi.mock("@/modules/placements/hr-interview-slot-service",()=>({listHrInterviewSlots:m.slots}));
vi.mock("@/modules/placements/recruiter-workspace-service",()=>({getRecruiterPlacementWorkspace:m.workspace}));
vi.mock("next/navigation",()=>({redirect:m.redirect,notFound:m.notFound}));
import HrRoundRemovalConfirm from "@/app/(authenticated)/hr/drives/[jobId]/rounds/editor/remove/[roundId]/page";
import DriveConversationsPage from "@/app/(authenticated)/hr/drives/[jobId]/messages/page";
import RecruiterInterviewSlots from "@/app/(authenticated)/hr/drives/[jobId]/interview-slots/page";
import HrRoundsEditorPage from "@/app/(authenticated)/hr/drives/[jobId]/rounds/editor/page";

const jobId="11111111-1111-4111-8111-111111111111";
const roundId="22222222-2222-4222-8222-222222222222";
const collegeId="33333333-3333-4333-8333-333333333333";
const version=new Date("2026-10-18T06:00:00.000Z");
const actor:RequestContext={
 user:{id:"recruiter",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,
 recruiter:{userId:"recruiter",companyId:"employer",companyName:"Employer",
  title:null,status:"ACTIVE",grants:[{id:"grant",organizationId:"org",
  collegeId,collegeName:"College",companyRelationshipId:"relation"}]},
};
const remove=(id=jobId,round=roundId)=>HrRoundRemovalConfirm({
 params:Promise.resolve({jobId:id,roundId:round}),
});
const messages=(id=jobId)=>DriveConversationsPage({params:Promise.resolve({jobId:id})});
const slots=(id=jobId)=>RecruiterInterviewSlots({params:Promise.resolve({jobId:id})});
const editor=(id=jobId)=>HrRoundsEditorPage({params:Promise.resolve({jobId:id})});
function visit(node:ReactNode, callback:(node:ReactElement)=>void):void{
 if(Array.isArray(node)){node.forEach(n=>visit(n,callback));return;}
 if(!isValidElement(node))return;
 callback(node);
 const p=node.props as {children?:ReactNode};
 visit(p.children,callback);
}
function strings(node:ReactNode):string{
 const fragments:string[]=[];
 function walk(child:ReactNode):void{
  if(Array.isArray(child)){child.forEach(walk);return;}
  if(typeof child==="string"||typeof child==="number"){fragments.push(String(child));return;}
  if(!isValidElement(child))return;
  const p=child.props as {children?:ReactNode;title?:string;description?:string};
  if(p.title)fragments.push(p.title);
  if(p.description)fragments.push(p.description);
  walk(p.children);
 }
 walk(node);return fragments.join(" ");
}
describe("HR-BREAK-chat19-drive-pages: job-specific actions never bypass scoped entry",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue(actor);
  m.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
  m.notFound.mockImplementation(()=>{throw new Error("NOT_FOUND");});
  m.rounds.mockResolvedValue([{id:roundId,sequence:1,name:"Screening",
   kind:"INTERVIEW",status:"PENDING",updatedAt:version,editable:true}]);
  m.conversation.mockResolvedValue({
   workspace:{job:{id:jobId,title:"Authorized role"},college:{id:collegeId,name:"College"}},
   threads:[],
  });
  m.slots.mockResolvedValue({items:[]});
  m.workspace.mockResolvedValue({job:{id:jobId,title:"Authorized role"},rounds:[]});
 });
 it("an expired recruiter cannot inspect round removal or conversation metadata",async()=>{
  m.ctx.mockResolvedValue({...actor,user:{...actor.user,platformStatus:"DISABLED"}});
  await expect(remove()).rejects.toThrow("REDIRECT");
  await expect(messages()).rejects.toThrow("REDIRECT");
  expect(m.rounds).not.toHaveBeenCalled();
  expect(m.conversation).not.toHaveBeenCalled();
 });
 it.each(["not-a-uuid","../admin","javascript:alert(1)"])(
  "does not look up an injected job ID %s",async id=>{
   await expect(remove(id)).rejects.toThrow("NOT_FOUND");
   await expect(messages(id)).rejects.toThrow("NOT_FOUND");
   expect(m.rounds).not.toHaveBeenCalled();
   expect(m.conversation).not.toHaveBeenCalled();
 });
 it("rejects invalid, missing, or noneditable rounds before showing a POST form",async()=>{
  await expect(remove(jobId,"bad")).rejects.toThrow("NOT_FOUND");
  expect(m.rounds).not.toHaveBeenCalled();
  m.rounds.mockResolvedValue([{id:roundId,editable:false}]);
  await expect(remove()).rejects.toThrow("NOT_FOUND");
  m.rounds.mockResolvedValue([]);
  await expect(remove()).rejects.toThrow("NOT_FOUND");
 });
 it("renders only a currently editable authorized round, with its optimistic version",async()=>{
  const result=await remove();
  expect(strings(result)).toContain("Confirm unused round removal");
  expect(m.rounds).toHaveBeenCalledWith(actor,jobId);
  const controls:Array<{type?:string;name?:string;value?:unknown;action?:unknown}>=[];
  visit(result,node=>{
   const p=node.props as {type?:string;name?:string;value?:unknown;action?:unknown};
   if(typeof node.type==="string"&&(node.type==="input"||node.type==="form"))
    controls.push(p);
  });
  expect(controls).toContainEqual(expect.objectContaining({name:"action",value:"REMOVE"}));
  expect(controls).toContainEqual(expect.objectContaining({name:"roundId",value:roundId}));
  expect(controls).toContainEqual(expect.objectContaining({
   name:"expectedUpdatedAt",value:version.toISOString(),
  }));
  expect(controls).toContainEqual(expect.objectContaining({
   action:"/api/placements/recruiter/drives/"+jobId+"/rounds",
  }));
 });
 it("renders an empty authorized drive conversation without inventing thread access",async()=>{
  const result=await messages();
  expect(m.conversation).toHaveBeenCalledWith(actor,jobId);
  expect(strings(result)).toContain("No conversation has been started for this drive.");
 });
 it("invalid interview slot and edit-round deep links deny access before either service read",async()=>{
  await expect(slots("../other-college")).rejects.toThrow("NOT_FOUND");
  await expect(editor("../other-college")).rejects.toThrow("NOT_FOUND");
  expect(m.slots).not.toHaveBeenCalled();
  expect(m.workspace).not.toHaveBeenCalled();
 });
 it("valid scoped interview time-block page never claims booked learner appointments",async()=>{
  const result=await slots();
  expect(m.slots).toHaveBeenCalledWith(actor,jobId);
  expect(m.workspace).toHaveBeenCalledWith(actor,jobId);
  expect(strings(result)).toContain("No persisted employer time blocks for this drive.");
  expect(strings(result)).toContain("No learner invitation or candidate booking");
 });
 it("round editor renders an accessible empty state without showing a stale removal option",async()=>{
  m.rounds.mockResolvedValue([]);
  const result=await editor();
  expect(m.rounds).toHaveBeenCalledWith(actor,jobId);
  expect(strings(result)).toContain("This drive has no hiring rounds.");
  expect(strings(result)).not.toContain("Confirm remove");
 });
 it("expired recruiter session never requests slot or round editor details",async()=>{
  m.ctx.mockResolvedValue({...actor,user:{...actor.user,platformStatus:"DISABLED"}});
  await expect(slots()).rejects.toThrow("REDIRECT");
  await expect(editor()).rejects.toThrow("REDIRECT");
  expect(m.slots).not.toHaveBeenCalled();
  expect(m.workspace).not.toHaveBeenCalled();
  expect(m.rounds).not.toHaveBeenCalled();
 });
 it("rejects removed recruiter profiles before either authorized drive read",async()=>{
  m.ctx.mockResolvedValue({...actor,recruiter:null});
  await expect(remove()).rejects.toThrow("REDIRECT");
  await expect(messages()).rejects.toThrow("REDIRECT");
  expect(m.rounds).not.toHaveBeenCalled();
  expect(m.conversation).not.toHaveBeenCalled();
 });
 it("HR-BREAK-DRIVE-PRINCIPAL-27 blocks mismatched recruiter on every drive action page",async()=>{
  m.ctx.mockResolvedValue({...actor,recruiter:{...actor.recruiter!,userId:"other-account"}});
  await expect(remove()).rejects.toThrow("REDIRECT");
  await expect(messages()).rejects.toThrow("REDIRECT");
  await expect(slots()).rejects.toThrow("REDIRECT");
  await expect(editor()).rejects.toThrow("REDIRECT");
  expect(m.rounds).not.toHaveBeenCalled();
  expect(m.conversation).not.toHaveBeenCalled();
  expect(m.slots).not.toHaveBeenCalled();
  expect(m.workspace).not.toHaveBeenCalled();
 });
});
