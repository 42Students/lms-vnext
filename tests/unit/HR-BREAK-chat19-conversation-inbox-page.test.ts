import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement,type ReactNode} from "react";
import type {RequestContext} from "@/modules/identity/context";
const m=vi.hoisted(()=>({ctx:vi.fn(),inbox:vi.fn(),thread:vi.fn(),notices:vi.fn(),
 redirect:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("@/modules/placements/hr-conversation-inbox-service",()=>({listHrConversations:m.inbox}));
vi.mock("@/modules/placements/tpo-messaging-service",()=>({readRecruiterThreadMessages:m.thread}));
vi.mock("@/modules/placements/recruiter-decision-notice-service",()=>({listOwnRecruiterDecisionNotices:m.notices}));
vi.mock("next/navigation",()=>({redirect:m.redirect}));
import RecruiterConversationsPage from "@/app/(authenticated)/hr/conversations/page";

const college="11111111-1111-4111-8111-111111111111";
const id="22222222-2222-4222-8222-222222222222";
const actor:RequestContext={
 user:{id:"recruiter",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,
 recruiter:{userId:"recruiter",companyId:"employer",companyName:"Employer",title:null,status:"ACTIVE",
  grants:[{id:"grant",organizationId:"org",collegeId:college,collegeName:"College",
   companyRelationshipId:"relation"}]},
};
const row={
 id,jobId:null,jobTitle:"General conversation",
 createdAt:new Date("2026-10-18T10:00:00Z"),lastMessageAt:new Date("2026-10-18T10:05:00Z"),
 unread:1,preview:{senderType:"TPO",text:"SECRET_NEVER_RENDER"},
};
const inbox={
 status:"READY",collegeId:college,choices:actor.recruiter!.grants,
 items:[row],total:1,page:1,pages:1,first:1,last:1,unreadInView:1,
};
const page=(query:Record<string,unknown>={})=>RecruiterConversationsPage({
 searchParams:Promise.resolve(query) as never,
});
function content(node:ReactNode):string {
 if(Array.isArray(node))return node.map(content).join(" ");
 if(typeof node==="number"||typeof node==="string")return String(node);
 if(!isValidElement(node))return "";
 const p=node.props as {children?:ReactNode,title?:string,description?:string,actions?:ReactNode,action?:ReactNode};
 return [p.title??"",p.description??"",content(p.children),content(p.actions),content(p.action)].join(" ");
}
function hrefs(node:ReactNode):string[]{
 if(Array.isArray(node))return node.flatMap(hrefs);
 if(!isValidElement(node))return [];
 const p=node.props as {children?:ReactNode;href?:unknown;actions?:ReactNode;action?:ReactNode};
 return [...(typeof p.href==="string"?[p.href]:[]),...hrefs(p.children),...hrefs(p.actions),...hrefs(p.action)];
}
describe("HR-BREAK-CONVO-04: inbox account, stale message and ancillary failure containment",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue(actor);
  m.inbox.mockResolvedValue(inbox);
  m.notices.mockResolvedValue([]);
  m.thread.mockResolvedValue({
   thread:{id,jobId:null,collegeId:college},messages:[],page:1,pages:0,total:0,unread:0,
  });
  m.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
 });
 it("HR-XA-09 notification action opens the bell inbox instead of looping through Messages alias",async()=>{
  const result=await page();
  expect((result as {type:unknown}).type).toBeDefined();
  const {readFileSync}=await import("node:fs");
  const workspace=readFileSync("src/components/hr/recruiter-conversation-workspace.tsx","utf8");
  expect(workspace).toContain('href="/hr/notifications"');
  expect(workspace).not.toContain('href="/hr/messages"');
 });
 it("an expired session never queries any inbox, thread or notifications",async()=>{
  m.ctx.mockResolvedValue({...actor,user:{...actor.user,platformStatus:"DISABLED"}});
  await expect(page()).rejects.toThrow("REDIRECT");
  expect(m.inbox).not.toHaveBeenCalled();
  expect(m.thread).not.toHaveBeenCalled();
  expect(m.notices).not.toHaveBeenCalled();
 });
 it.each([{collegeId:"wrong"},{page:"0"},{q:"x".repeat(121)},{scope:"PRIVATE"},
  {collegeId:[college,"22222222-2222-4222-8222-222222222222"]},
  {page:["1","100"]},{q:["first","second"]}])(
  "invalid %j rejects without reading private message bodies",async bad=>{
   expect(content(await page(bad))).toContain("Invalid conversation filters");
   expect(m.inbox).not.toHaveBeenCalled();
  });
 it("when a second live grant check fails, never display an older cached preview or inline reply",async()=>{
  m.thread.mockRejectedValue(new Error("revoked grant"));
  m.notices.mockRejectedValue(new Error("private operational detail"));
  const result=await page({collegeId:college});
  const props=(result as {props:{
   selectedHistoryUnavailable:boolean;decisionNoticesUnavailable:boolean;
   generalPreviewUnavailable:boolean;rows:Array<{preview:{text:string}|null}>;
  }}).props;
  expect(props.selectedHistoryUnavailable).toBe(true);
  expect(props.decisionNoticesUnavailable).toBe(true);
  expect(props.generalPreviewUnavailable).toBe(false);
  expect(props.rows.every(row=>row.preview===null)).toBe(true);
  expect((result as {props:{selected:{preview:unknown}|null}}).props.selected?.preview).toBeNull();
  expect(JSON.stringify(props)).not.toContain("SECRET_NEVER_RENDER");
  expect(JSON.stringify(props)).not.toContain("private operational detail");
  expect(m.inbox).toHaveBeenCalledTimes(2);
  expect(m.thread).toHaveBeenCalledWith(actor,id,1);
  expect(m.notices).toHaveBeenCalledWith(actor,college);
 });
 it("a failed live grant check blocks stale private decisions and replies",async()=>{
  m.inbox.mockResolvedValueOnce(inbox).mockRejectedValueOnce(new Error("grant revoked"));
  m.notices.mockResolvedValue([{id:"sensitive",title:"SECRET_DECISION",
   body:"SECRET_BODY",href:"/hr/drives",createdAt:new Date(),unread:true}]);
  const result=await page({collegeId:college});
  const props=(result as {props:{
   generalPreviewUnavailable:boolean;decisionNotices:unknown[];
   rows:unknown[];selected:unknown;
  }}).props;
  expect(props.generalPreviewUnavailable).toBe(true);
  expect(props.rows).toEqual([]);
  expect(props.selected).toBeNull();
  expect(props.decisionNotices).toEqual([]);
  expect(JSON.stringify(props)).not.toContain("SECRET_DECISION");
  expect(m.thread).not.toHaveBeenCalled();
 });
 it("a removed grant shows a recovery notice with no second private thread read",async()=>{
  m.inbox.mockResolvedValue({status:"NO_ACCESS",choices:[],items:[],collegeId:null});
  const result=await page();
  expect(content(result)).toContain("Your access to this college has ended or was removed.");
  expect(m.thread).not.toHaveBeenCalled();
  expect(m.notices).not.toHaveBeenCalled();
 });
 it("HR-BREAK-CONVO-PRINCIPAL-28 denies mismatched recruiter before inbox and preview",async()=>{
  m.ctx.mockResolvedValue({...actor,recruiter:{...actor.recruiter!,userId:"other-user"}});
  await expect(page()).rejects.toThrow("REDIRECT");
  expect(m.inbox).not.toHaveBeenCalled();
  expect(m.thread).not.toHaveBeenCalled();
  expect(m.notices).not.toHaveBeenCalled();
 });
});
