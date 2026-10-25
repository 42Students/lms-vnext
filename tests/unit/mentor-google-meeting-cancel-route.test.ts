import {beforeEach,describe,expect,it,vi} from "vitest";
const fake=vi.hoisted(()=>({context:vi.fn(),remove:vi.fn(),sync:vi.fn(),check:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:fake.context}));
vi.mock("@/modules/projects/mentor-google-meeting-sync-service",()=>({
 removeCancelledMentorGoogleMeeting:fake.remove,
 syncMentorGoogleMeeting:fake.sync,
 checkMentorGoogleMeeting:fake.check,
}));
import {DELETE} from "@/app/api/projects/[projectId]/meetings/[meetingId]/google/route";
const projectId="11111111-1111-4111-8111-111111111111";
const meetingId="22222222-2222-4222-8222-222222222222";
const params={params:Promise.resolve({projectId,meetingId})};
function req(origin="https://campus.example"){
 return new Request("https://campus.example/api/projects/"+projectId+
  "/meetings/"+meetingId+"/google",{method:"DELETE",
   headers:{origin,host:"campus.example"}});
}
describe("Cancelled Google calendar event boundary",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();fake.context.mockResolvedValue({user:{id:"mentor"}});
  fake.remove.mockResolvedValue({removed:true,providerStatus:null});
 });
 it("blocks a forged origin before reading the user or invoking provider service",async()=>{
  const response=await DELETE(req("https://attacker.example"),params);
  expect(response.status).toBe(403);
  expect(fake.context).not.toHaveBeenCalled();
  expect(fake.remove).not.toHaveBeenCalled();
 });
 it("only delegates IDs to the checked service and returns no cached state",async()=>{
  const response=await DELETE(req(),params);
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toContain("no-store");
  expect(fake.remove).toHaveBeenCalledWith({user:{id:"mentor"}},
   projectId,meetingId);
  expect(await response.json()).toEqual({removed:true,providerStatus:null});
 });
});
