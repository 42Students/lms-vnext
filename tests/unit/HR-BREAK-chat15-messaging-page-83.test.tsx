import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement,type ReactNode} from "react";
import type {RequestContext} from "@/modules/identity/context";
const m=vi.hoisted(()=>({ctx:vi.fn(),redirect:vi.fn(),list:vi.fn(),
 messages:vi.fn(),notices:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("next/navigation",()=>({redirect:m.redirect}));
vi.mock("@/modules/placements/hr-conversation-inbox-service",()=>({
 listHrConversations:m.list,
}));
vi.mock("@/modules/placements/tpo-messaging-service",()=>({
 readRecruiterThreadMessages:m.messages,
}));
vi.mock("@/modules/placements/recruiter-decision-notice-service",()=>({
 listOwnRecruiterDecisionNotices:m.notices,
}));
vi.mock("@/components/hr/recruiter-conversation-live-refresh",()=>({
 RecruiterConversationLiveRefresh:()=>null,
}));
import RecruiterConversationsPage from "@/app/(authenticated)/hr/conversations/page";

const collegeId="123e4567-e89b-42d3-a456-426614174001";
const actor:RequestContext={
 user:{id:"recruiter",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,recruiter:{userId:"recruiter",status:"ACTIVE",companyId:"employer",
  companyName:"Employer",title:null,grants:[{
   id:"grant",collegeId,collegeName:"College",
   organizationId:"org",companyRelationshipId:"relationship",
  }]},
};
const empty={status:"READY" as const,collegeId,choices:actor.recruiter!.grants,items:[],
 total:0,unreadInView:0,page:1,pages:1,first:0,last:0};
const view=(q:Record<string,string|string[]|undefined>={})=>
 RecruiterConversationsPage({searchParams:Promise.resolve(q)});
function text(node:ReactNode):string{
 if(Array.isArray(node))return node.map(text).join(" ");
 if(typeof node==="string"||typeof node==="number")return String(node);
 if(!isValidElement(node))return "";
 const p=node.props as {children?:ReactNode;title?:string;description?:string;actions?:ReactNode};
 return [p.title??"",p.description??"",text(p.actions),text(p.children)].join(" ");
}
function hasGeneralOpenForm(node:ReactNode):boolean{
 if(Array.isArray(node))return node.some(hasGeneralOpenForm);
 if(!isValidElement(node))return false;
 const p=node.props as {children?:ReactNode;action?:string;actions?:ReactNode};
 return p.action==="/api/placements/recruiter/conversations/open"||
  hasGeneralOpenForm(p.actions)||hasGeneralOpenForm(p.children);
}
describe("HR-MESSAGING-83: general preview failure is recoverable without double-open",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue(actor);m.list.mockResolvedValue(empty);
  m.notices.mockResolvedValue([]);m.redirect.mockImplementation(()=>{
   throw new Error("REDIRECT");
  });
 });
 it("secondary general directory timeout preserves the authorized main message page",async()=>{
  m.list.mockResolvedValueOnce(empty).mockRejectedValueOnce(new Error("general timeout"));
  const output=await view();
  const props=(output as {props:{generalPreviewUnavailable:boolean;rows:unknown[];selected:unknown;decisionNoticesUnavailable:boolean}}).props;
  expect(props.generalPreviewUnavailable).toBe(true);
  expect(props.rows).toEqual([]);
  expect(props.selected).toBeNull();
  // A timed-out independent grant recheck cannot authorize private decisions,
  // even if their own downstream notice lookup succeeded.
  expect(props.decisionNoticesUnavailable).toBe(true);
  expect(hasGeneralOpenForm(output)).toBe(false);
  expect(m.notices).toHaveBeenCalledWith(actor,collegeId);
  expect(m.messages).not.toHaveBeenCalled();
 });
 it("genuine empty general directory offers the single-flight general conversation opener",async()=>{
  const output=await view();
  const props=(output as {props:{generalPreviewUnavailable:boolean;rows:unknown[];selected:unknown}}).props;
  expect(props.generalPreviewUnavailable).toBe(false);
  expect(props.rows).toEqual([]);
  expect(props.selected).toBeNull();
  // The form is rendered by the two-pane component after scoped revalidation.
  const {readFileSync}=await import("node:fs");
  expect(readFileSync("src/components/hr/recruiter-conversation-workspace.tsx","utf8"))
   .toContain('!q&&!generalPreviewUnavailable?<form method="post" action="/api/placements/recruiter/conversations/open"');

 });
 it("revoked HR sessions never load the private inbox or general directory",async()=>{
  m.ctx.mockResolvedValue({...actor,user:{...actor.user,platformStatus:"DISABLED"}});
  await expect(view()).rejects.toThrow("REDIRECT");
  expect(m.list).not.toHaveBeenCalled();
  expect(m.notices).not.toHaveBeenCalled();
 });
 it("malformed duplicate college filters never read private messages",async()=>{
  const output=await view({collegeId:[collegeId,collegeId]});
  expect(text(output)).toContain("Invalid conversation filters");
  expect(m.list).not.toHaveBeenCalled();
 });
 it("primary inbox outage remains a real page failure and does not invent empty status",async()=>{
  m.list.mockRejectedValue(new Error("primary inbox failed"));
  const output=await view();
  expect(text(output)).toContain("Could not load your messages");
  expect(text(output)).toContain("Your inbox could not be refreshed.");
  expect(hasGeneralOpenForm(output)).toBe(false);
  expect(m.notices).not.toHaveBeenCalled();
 });
});