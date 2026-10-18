import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {isSameOriginRequest} from "@/auth/origin";
import {dispatchRecruiterUnreadMessageDigests} from "@/modules/placements/recruiter-message-email-dispatch-service";
import {POST} from "@/app/api/internal/placements/recruiter-message-reminders/route";

vi.mock("@/auth/origin",()=>({isSameOriginRequest:vi.fn()}));
vi.mock("@/modules/placements/recruiter-message-email-dispatch-service",()=>({
 dispatchRecruiterUnreadMessageDigests:vi.fn(),
}));
const previous=process.env.RECRUITER_MESSAGE_WORKER_SECRET;
const secret="S".repeat(48);
const invoke=(authorization?:string)=>new Request(
 "https://lms.example.org/api/internal/placements/recruiter-message-reminders",{
 method:"POST",headers:authorization?{authorization}:{},
});
beforeEach(()=>{
 vi.clearAllMocks();
 process.env.RECRUITER_MESSAGE_WORKER_SECRET=secret;
 vi.mocked(isSameOriginRequest).mockReturnValue(true);
 vi.mocked(dispatchRecruiterUnreadMessageDigests).mockResolvedValue({
  examined:2,sent:1,enabled:true,
 });
});
afterEach(()=>{
 if(previous===undefined)delete process.env.RECRUITER_MESSAGE_WORKER_SECRET;
 else process.env.RECRUITER_MESSAGE_WORKER_SECRET=previous;
});

describe("chat-16 authenticated recruiter email digest worker POST",()=>{
 it("HR-MAIL-REMINDERS-01 denies cross-origin requests before dispatch",async()=>{
  vi.mocked(isSameOriginRequest).mockReturnValue(false);
  const response=await POST(invoke("Bearer "+secret));
  expect(response.status).toBe(403);
  expect(dispatchRecruiterUnreadMessageDigests).not.toHaveBeenCalled();
 });
 it("HR-MAIL-REMINDERS-02 denies missing, forged and improperly formatted tokens",async()=>{
  for(const token of [undefined,"Bearer wrong","Basic "+secret,secret,"Bearer "+secret+"extra"]){
   expect((await POST(invoke(token))).status).toBe(403);
  }
  expect(dispatchRecruiterUnreadMessageDigests).not.toHaveBeenCalled();
 });
 it("HR-MAIL-REMINDERS-03 fails closed on blank, short and whitespace-quoted worker secrets",async()=>{
  for(const configured of [" ".repeat(48),"short"," "+secret,secret+" "]){
   process.env.RECRUITER_MESSAGE_WORKER_SECRET=configured;
   expect((await POST(invoke("Bearer "+configured))).status).toBe(403);
  }
  expect(dispatchRecruiterUnreadMessageDigests).not.toHaveBeenCalled();
 });
 it("HR-MAIL-REMINDERS-04 invokes one worker for an authenticated request without cache",async()=>{
  const response=await POST(invoke("Bearer "+secret));
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({examined:2,sent:1,enabled:true});
  expect(dispatchRecruiterUnreadMessageDigests).toHaveBeenCalledTimes(1);
 });
 it("HR-MAIL-REMINDERS-05 maps worker outages to a generic 503 without private details",async()=>{
  vi.mocked(dispatchRecruiterUnreadMessageDigests).mockRejectedValue(new Error("secrets/db connection"));
  const response=await POST(invoke("Bearer "+secret));
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain("secrets/db connection");
 });
});
