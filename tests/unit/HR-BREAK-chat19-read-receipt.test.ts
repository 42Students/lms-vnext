import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
import {isVerifiedRecruiterDecisionReadReceipt} from "@/modules/placements/recruiter-decision-read-model";
const mocks=vi.hoisted(()=>({context:vi.fn(),origin:vi.fn(),read:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:mocks.origin}));
vi.mock("@/modules/placements/hr-notification-read-service",()=>({markHrNotificationRead:mocks.read}));
import {POST} from "@/app/api/placements/recruiter/notifications/[notificationId]/read/route";
const id="11111111-1111-4111-8111-111111111111";
const expectedCreatedAt="2026-10-18T12:00:00.000Z";
function request(){
 return new Request("https://lms.invalid/api/placements/recruiter/notifications/"+id+"/read",{
  method:"POST",
  headers:{"Content-Type":"application/json",Accept:"application/json"},
  body:JSON.stringify({expectedCreatedAt}),
 });
}
const invoke=(req:Request)=>POST(req,{params:Promise.resolve({notificationId:id})});
describe("HR-BREAK-READ-RECEIPT-48: exact persisted employer notification acknowledgment",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();mocks.origin.mockReturnValue(true);
  mocks.context.mockResolvedValue({user:{id:"recruiter"}});
  mocks.read.mockResolvedValue({id,readAt:"2026-10-18T12:05:00.000Z"});
 });
 it("returns a typed persisted notification read receipt only after the service resolves",async()=>{
  const response=await invoke(request());
  expect(response.status).toBe(200);
  const payload:unknown=await response.json();
  expect(isVerifiedRecruiterDecisionReadReceipt(payload,id)).toBe(true);
  expect(mocks.read).toHaveBeenCalledWith(expect.anything(),id,{expectedCreatedAt});
 });
 it("rejects cross-origin posts before reading the session or touching notification state",async()=>{
  mocks.origin.mockReturnValue(false);
  const response=await invoke(request());
  expect(response.status).toBe(403);
  expect(mocks.read).not.toHaveBeenCalled();
  expect(mocks.context).not.toHaveBeenCalled();
 });
 it("never treats a foreign, missing, HTML or unread notification as a successful response",()=>{
  for(const payload of [
   null,"<html>Sign in</html>",{notification:{id,readAt:null}},
   {notification:{id:"22222222-2222-4222-8222-222222222222",readAt:"2026-10-18T12:05:00.000Z"}},
   {notification:{id,readAt:"garbage"}},
  ])expect(isVerifiedRecruiterDecisionReadReceipt(payload,id)).toBe(false);
 });
 it("client verifies receipt before success state and rejects redirect or HTML 200",()=>{
  const src=readFileSync("src/components/hr/hr-notification-read-button.tsx","utf8");
  const verify=src.indexOf("isVerifiedRecruiterDecisionReadReceipt(payload,notificationId)");
  const done=src.indexOf("completeRef.current=true");
  expect(verify).toBeGreaterThan(0);
  expect(done).toBeGreaterThan(verify);
  expect(src).toContain('redirect:"error"');
  expect(src).toContain("min-h-11");
  expect(src).toContain("if(completeRef.current || !gate.current.tryBegin())return");
 });
});
