import {describe,expect,it} from "vitest";
import {hrConversationQuerySchema,filterRecruiterConversations,hrConversationPageBounds,
 onlyUnreadRecruiterThreads,orderRecruiterConversations,scopeRecruiterConversations,countScopedConversations}
 from "@/modules/placements/hr-conversation-inbox-model";
import {conversationSnippet} from "@/modules/placements/hr-conversation-snippet-model";
import {hrConversationDetailPageWindow} from "@/modules/placements/hr-conversation-detail-pagination-model";
import {hrConversationDetailHref} from "@/modules/placements/hr-conversation-detail-links-model";
import {hrConversationsHref} from "@/modules/placements/hr-conversation-urls-model";
import {hrReplySuccess,hrReplyErrorMessage} from "@/modules/placements/hr-conversation-send-feedback-model";
import {recruiterInboxReturnUrl} from "@/modules/placements/hr-conversation-return-url-model";
import {summarizeRecruiterUnread} from "@/modules/placements/hr-conversation-unread-model";
import {hrOpenRecruiterConversationSchema} from "@/modules/placements/hr-conversation-open-model";

const college="11111111-1111-4111-8111-111111111111";
const job="22222222-2222-4222-8222-222222222222";
const other="33333333-3333-4333-8333-333333333333";
const at=(n:number)=>new Date("2099-01-01T00:00:00.000Z").getTime()+n*1000;
describe("chat-16 HR conversations filter, redirect and responsiveness edge cases",()=>{
 it("REC-calendar-messages-profile-08 restricts query scope, IDs and page bounds",()=>{
  expect(hrConversationQuerySchema.parse({})).toEqual({q:"",page:1,unreadOnly:"false",sort:"LATEST",scope:"ALL"});
  expect(hrConversationQuerySchema.safeParse({collegeId:"invalid"}).success).toBe(false);
  expect(hrConversationQuerySchema.safeParse({page:"0"}).success).toBe(false);
  expect(hrConversationQuerySchema.safeParse({page:"10001"}).success).toBe(false);
  expect(hrConversationQuerySchema.safeParse({scope:"PRIVATE"}).success).toBe(false);
  expect(hrConversationQuerySchema.safeParse({q:"x".repeat(121)}).success).toBe(false);
 });
 it("hr-messages-tenancy-02 never includes drive conversations outside authorized job IDs",()=>{
  const rows=[{id:"general",jobId:null},{id:"mine",jobId:job},{id:"another",jobId:other}];
  const allowed=new Set([job]);
  expect(filterRecruiterConversations(rows,allowed,"").map(x=>x.id)).toEqual(["general","mine"]);
  expect(filterRecruiterConversations(rows,allowed,"my job",new Map([[job,"My Job"]])).map(x=>x.id)).toEqual(["mine"]);
  expect(filterRecruiterConversations(rows,allowed,"hidden",new Map([[other,"Hidden"]])).length).toBe(0);
  expect(filterRecruiterConversations(rows,allowed,"general",new Map(),new Set(["general"])).map(x=>x.id)).toEqual(["general"]);
 });
 it("hr-messages-scope-02 isolates general and drive tabs without losing unread counts",()=>{
  const rows=[{id:"general",jobId:null},{id:"mine",jobId:job}];
  expect(scopeRecruiterConversations(rows,"GENERAL").map(x=>x.id)).toEqual(["general"]);
  expect(scopeRecruiterConversations(rows,"DRIVE").map(x=>x.id)).toEqual(["mine"]);
  expect(countScopedConversations(scopeRecruiterConversations(rows,"ALL"))).toBe(2);
  expect(onlyUnreadRecruiterThreads(rows,new Set(["mine"]),true).map(x=>x.id)).toEqual(["mine"]);
  expect(summarizeRecruiterUnread([{unread:2},{unread:-2},{unread:1}])).toBe(3);
 });
 it("hr-messages-order-02 is stable when messages share the same timestamp",()=>{
  const rows=[{id:"b",createdAt:new Date(at(0)),lastMessageAt:null},
   {id:"a",createdAt:new Date(at(0)),lastMessageAt:null},
   {id:"c",createdAt:new Date(at(1)),lastMessageAt:null}];
  expect(orderRecruiterConversations(rows,"LATEST").map(x=>x.id)).toEqual(["c","a","b"]);
  expect(orderRecruiterConversations(rows,"OLDEST").map(x=>x.id)).toEqual(["a","b","c"]);
 });
 it("hr-messages-page-02 always bounds malformed or stale page numbers",()=>{
  expect(hrConversationPageBounds(3,31)).toMatchObject({page:2,pages:2,first:21,last:31});
  expect(hrConversationPageBounds(Number.NaN,31)).toMatchObject({page:1,pages:2,first:1,last:20});
  expect(hrConversationPageBounds(1,Number.NaN)).toMatchObject({page:1,pages:1,first:0,last:0});
  expect(hrConversationDetailPageWindow(2,42)).toEqual({page:2,pages:2,offset:40});
  expect(hrConversationDetailPageWindow(Number.NaN,42)).toEqual({page:1,pages:2,offset:0});
  expect(hrConversationDetailPageWindow(3,42)).toEqual({page:2,pages:2,offset:40});
 });
 it("hr-messages-snippet-02 never reveals almost all of a message on negative max length",()=>{
  expect(conversationSnippet("  A \n B  ")).toBe("A B");
  expect(conversationSnippet("abcdefgh",4)).toBe("abc…");
  expect(conversationSnippet("abcdefgh",-1)).toBe("");
  expect(conversationSnippet("abcdefgh",0)).toBe("");
  expect(conversationSnippet("abcdefgh",Number.NaN)).toBe("abcdefgh");
  expect(conversationSnippet("a".repeat(900),2000)).toHaveLength(500);
 });
 it("hr-messages-links-02 restricts URLs to a validated destination with no open redirect",()=>{
  const safe="https://lms.example.org/hr/conversations?collegeId="+college+"&scope=GENERAL";
  expect(recruiterInboxReturnUrl(safe,"https://lms.example.org/api/msg").toString()).toBe(safe);
  for(const unsafe of ["https://attacker.example.org/hr/conversations","//attacker.example.org/x",
   "/hr/conversations#secret","/admin/users","/hr/conversations?collegeId=invalid"]){
   expect(recruiterInboxReturnUrl(unsafe,"https://lms.example.org/api/msg").pathname).toBe("/hr/conversations");
   expect(recruiterInboxReturnUrl(unsafe,"https://lms.example.org/api/msg").search).toBe("");
  }
  expect(hrConversationDetailHref(job,2)).toBe("/hr/conversations/"+job+"?page=2");
  expect(()=>hrConversationDetailHref("wrong",2)).toThrow();
  expect(()=>hrConversationDetailHref(job,-1)).toThrow();
  expect(hrConversationsHref({collegeId:college,q:"hello",unreadOnly:"false",page:1})).toContain("collegeId=");
 });
 it("hr-messages-send-02 never treats a 200 response without approved redirect as sent",()=>{
  expect(hrReplySuccess({status:200,redirected:true,redirectPath:"/hr/conversations/"+job,threadId:job})).toBe(true);
  expect(hrReplySuccess({status:200,redirected:false,redirectPath:"/hr/conversations/"+job,threadId:job})).toBe(false);
  expect(hrReplySuccess({status:200,redirected:true,redirectPath:"/admin",threadId:job})).toBe(false);
  expect(hrReplyErrorMessage(403)).toContain("access to this college has ended");
  expect(hrReplyErrorMessage(500)).toContain("Retry");
  expect(hrReplyErrorMessage(400)).toContain("4000");
 });
 it("hr-messages-open-02 refuses arbitrary roles, additional fields and invalid UUIDs",()=>{
  expect(hrOpenRecruiterConversationSchema.safeParse({collegeId:college,jobId:job}).success).toBe(true);
  expect(hrOpenRecruiterConversationSchema.safeParse({collegeId:other,jobId:"bad"}).success).toBe(false);
  expect(hrOpenRecruiterConversationSchema.safeParse({collegeId:college,role:"TPO"}).success).toBe(false);
 });
});
