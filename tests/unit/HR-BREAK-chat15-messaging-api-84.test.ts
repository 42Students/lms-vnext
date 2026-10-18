import {beforeEach,describe,expect,it,vi} from "vitest";
const m=vi.hoisted(()=>({ctx:vi.fn(),origin:vi.fn(),open:vi.fn(),reply:vi.fn(),
 error:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:m.origin}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:m.error}));
vi.mock("@/modules/placements/tpo-messaging-service",()=>({
 openRecruiterMessageThread:m.open,sendRecruiterThreadMessage:m.reply,
 TpoMessagingError:class TpoMessagingError extends Error{
  code:string;constructor(code:string){super(code);this.code=code;}
 },
}));
import {POST as openPOST} from "@/app/api/placements/recruiter/conversations/open/route";
import {POST as replyPOST} from "@/app/api/placements/recruiter/conversations/[threadId]/reply/route";
const college="123e4567-e89b-42d3-a456-426614174001";
const thread="123e4567-e89b-42d3-a456-426614174002";
const actor={user:{id:"recruiter",platformStatus:"ACTIVE",systemRoles:[]},
 recruiter:{userId:"recruiter",status:"ACTIVE",companyId:"company",grants:[]}};
const request=(path:string,form:Record<string,string>)=>new Request(
 "https://lms.example/api/placements/recruiter/conversations/"+path,{
 method:"POST",body:new URLSearchParams(form),
});
const open=()=>openPOST(request("open",{collegeId:college}));
const reply=(body="Thank you")=>replyPOST(request(thread+"/reply",{body}),{
 params:Promise.resolve({threadId:thread}),
});
describe("HR-MESSAGING-84: recruiter open/reply HTTP role matrix and safe retries",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.origin.mockReturnValue(true);m.ctx.mockResolvedValue(actor);
  m.open.mockResolvedValue({id:thread});m.reply.mockResolvedValue({id:"message"});
  m.error.mockImplementation(()=>Response.json({error:"UNAVAILABLE"},{status:503}));
 });
 it("cross-origin POSTs deny before parsing request context or writing",async()=>{
  m.origin.mockReturnValue(false);
  expect((await open()).status).toBe(403);
  expect((await reply()).status).toBe(403);
  expect(m.ctx).not.toHaveBeenCalled();
  expect(m.open).not.toHaveBeenCalled();
  expect(m.reply).not.toHaveBeenCalled();
 });
 it("identity-swapped grant cannot open or write through the HTTP boundary",async()=>{
  m.ctx.mockResolvedValue({...actor,recruiter:{...actor.recruiter,userId:"other-user"}});
  expect((await open()).status).toBe(403);
  expect((await reply()).status).toBe(403);
  expect(m.open).not.toHaveBeenCalled();
  expect(m.reply).not.toHaveBeenCalled();
 });
 it("disabled session cannot use a cached recruiter context to send mail/chat",async()=>{
  m.ctx.mockResolvedValue({...actor,user:{...actor.user,platformStatus:"DISABLED"}});
  expect((await open()).status).toBe(403);
  expect((await reply()).status).toBe(403);
  expect(m.reply).not.toHaveBeenCalled();
 });
 it("invalid college and blank reply fail before user lookup or persistence",async()=>{
  const badOpen=await openPOST(request("open",{collegeId:"foreign"}));
  const badReply=await reply("");
  expect(badOpen.status).toBe(400);
  expect(badReply.status).toBe(400);
  expect(m.ctx).not.toHaveBeenCalled();
 });
 it("authorized general thread and a reply redirect only to their own returned thread ID",async()=>{
  const openResponse=await open();
  expect(openResponse.status).toBe(303);
  expect(openResponse.headers.get("location")).toBe("https://lms.example/hr/conversations/"+thread);
  expect(m.open).toHaveBeenCalledWith(actor,expect.objectContaining({collegeId:college}));
  const sentResponse=await reply(" Confirmed ");
  expect(sentResponse.status).toBe(303);
  expect(m.reply).toHaveBeenCalledWith(actor,thread,"Confirmed");
 });
 it("downstream failures do not claim a message was sent",async()=>{
  m.reply.mockRejectedValue(new Error("database offline"));
  const response=await reply();
  expect(response.status).toBe(503);
  expect(await response.json()).toMatchObject({error:"UNAVAILABLE"});
 });
});